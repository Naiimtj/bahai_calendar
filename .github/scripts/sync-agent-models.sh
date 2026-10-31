#!/usr/bin/env bash

set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
if [[ "$(basename "$(dirname "$script_dir")")" == '.github' ]]; then
  copied_template_root=$(cd "$script_dir/.." && pwd)
  repo_root=$(cd "$copied_template_root/.." && pwd)
  default_templates=("$copied_template_root")
  sync_command='bash .github/scripts/sync-agent-models.sh'
  default_scope='this copied .github template'
else
  repo_root=$(cd "$script_dir/.." && pwd)
  default_templates=(
    "$repo_root/front-end/.github"
    "$repo_root/back-end/.github"
    "$repo_root/FrontBack/.github"
  )
  sync_command='bash scripts/sync-agent-models.sh'
  default_scope='all templates under Github setup starter'
fi
check_only=false
failures=0
updates=0
generated_comment='# Generated from .github/MODELS.md by .github/scripts/sync-agent-models.sh. Do not edit.'

usage() {
  printf 'Usage: %s [--check] [path/to/.github ...]\n\n' "$sync_command"
  printf 'Without paths, synchronizes %s.\n' "$default_scope"
  printf 'Edit the MODEL-SYNC manifest in each .github/MODELS.md, then run this script.\n'
  printf 'Use --check in CI to report drift without modifying files.\n'
}

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  failures=$((failures + 1))
}

frontmatter_model() {
  awk '
    BEGIN { delimiters = 0 }
    /^---[[:space:]]*$/ { delimiters++; next }
    delimiters == 1 && /^model:[[:space:]]*/ {
      sub(/\r$/, "")
      print
      exit
    }
  ' "$1"
}

frontmatter_has_generated_comment() {
  awk -v expected="$generated_comment" '
    BEGIN { delimiters = 0 }
    /^---[[:space:]]*$/ { delimiters++; next }
    delimiters == 1 {
      line = $0
      sub(/\r$/, "", line)
      if (line == expected) {
        generated_count++
        previous_was_marker = 1
      } else if (line ~ /^# Generated from \.github\/MODELS\.md by scripts\/sync-agent-models\.sh\. Do not edit\.$/) {
        legacy_count++
        previous_was_marker = 0
      } else if (line ~ /^model:[[:space:]]*/) {
        model_count++
        if (previous_was_marker) {
          marker_before_model_count++
        }
        previous_was_marker = 0
      } else {
        previous_was_marker = 0
      }
    }
    END {
      exit(generated_count == 1 && legacy_count == 0 && model_count == 1 && marker_before_model_count == 1 ? 0 : 1)
    }
  ' "$1"
}

frontmatter_has_generated_marker() {
  awk -v expected="$generated_comment" '
    BEGIN { delimiters = 0; found = 0 }
    /^---[[:space:]]*$/ { delimiters++; next }
    delimiters == 1 {
      line = $0
      sub(/\r$/, "", line)
      if (line == expected || line ~ /^# Generated from \.github\/MODELS\.md by (\.github\/)?scripts\/sync-agent-models\.sh\. Do not edit\.$/) {
        found = 1
      }
    }
    END { exit(found ? 0 : 1) }
  ' "$1"
}

yaml_model_line() {
  local primary=$1
  local fallback=$2

  primary=${primary//\\/\\\\}
  primary=${primary//\"/\\\"}
  fallback=${fallback//\\/\\\\}
  fallback=${fallback//\"/\\\"}

  printf 'model: ["%s", "%s"]' "$primary" "$fallback"
}

profile_ids=()
profile_primary=()
profile_fallback=()
assignment_paths=()
assignment_profiles=()

reset_manifest() {
  profile_ids=()
  profile_primary=()
  profile_fallback=()
  assignment_paths=()
  assignment_profiles=()
}

find_profile() {
  local requested_profile=$1
  local index

  for index in "${!profile_ids[@]}"; do
    if [[ "${profile_ids[$index]}" == "$requested_profile" ]]; then
      resolved_primary=${profile_primary[$index]}
      resolved_fallback=${profile_fallback[$index]}
      return 0
    fi
  done

  return 1
}

find_assignment() {
  local requested_path=$1
  local index

  for index in "${!assignment_paths[@]}"; do
    if [[ "${assignment_paths[$index]}" == "$requested_path" ]]; then
      resolved_profile=${assignment_profiles[$index]}
      return 0
    fi
  done

  return 1
}

is_safe_assignment_path() {
  local requested_path=$1
  local segment
  local path_segments=()

  case "$requested_path" in
    ''|/*|*//*|*[!A-Za-z0-9._/-]*) return 1 ;;
  esac

  IFS='/' read -r -a path_segments <<< "$requested_path"
  for segment in "${path_segments[@]}"; do
    case "$segment" in
      ''|.|..) return 1 ;;
    esac
  done

  case "$requested_path" in
    agents/*.agent.md|prompts/*.prompt.md) return 0 ;;
    *) return 1 ;;
  esac
}

has_symlink_component() {
  local root=$1
  local relative_path=$2
  local current_path=$root
  local segment
  local path_segments=()

  IFS='/' read -r -a path_segments <<< "$relative_path"
  for segment in "${path_segments[@]}"; do
    current_path="$current_path/$segment"
    if [[ -L "$current_path" ]]; then
      return 0
    fi
  done

  return 1
}

parse_manifest() {
  local models_file=$1
  local in_manifest=false
  local manifest_seen=false
  local raw_line line kind key primary fallback extra

  reset_manifest

  while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
    line=${raw_line%$'\r'}

    if [[ "$line" == '<!-- MODEL-SYNC:START -->' ]]; then
      in_manifest=true
      manifest_seen=true
      continue
    fi
    if [[ "$line" == '<!-- MODEL-SYNC:END -->' ]]; then
      in_manifest=false
      break
    fi
    if [[ "$in_manifest" != true || -z "$line" || "${line:0:1}" == '#' ]]; then
      continue
    fi

    IFS='|' read -r kind key primary fallback extra <<< "$line"
    case "$kind" in
      profile)
        if [[ -z "$key" || -z "$primary" || -z "$fallback" || -n "$extra" ]]; then
          fail "invalid profile entry in ${models_file#"$repo_root/"}: $line"
          continue
        fi
        if find_profile "$key"; then
          fail "duplicate profile '$key' in ${models_file#"$repo_root/"}"
          continue
        fi
        profile_ids+=("$key")
        profile_primary+=("$primary")
        profile_fallback+=("$fallback")
        ;;
      assignment)
        if [[ -z "$key" || -z "$primary" || -n "$fallback" || -n "$extra" ]]; then
          fail "invalid assignment entry in ${models_file#"$repo_root/"}: $line"
          continue
        fi
        if ! is_safe_assignment_path "$key"; then
          fail "unsafe assignment path '$key' in ${models_file#"$repo_root/"}"
          continue
        fi
        if find_assignment "$key"; then
          fail "duplicate assignment '$key' in ${models_file#"$repo_root/"}"
          continue
        fi
        assignment_paths+=("$key")
        assignment_profiles+=("$primary")
        ;;
      *)
        fail "unknown manifest entry in ${models_file#"$repo_root/"}: $line"
        ;;
    esac
  done < "$models_file"

  if [[ "$manifest_seen" != true || "$in_manifest" == true ]]; then
    fail "missing or incomplete MODEL-SYNC manifest: ${models_file#"$repo_root/"}"
  fi
}

write_model() {
  local file=$1
  local expected=$2
  local temporary_file

  temporary_file=$(mktemp "${file}.tmp.XXXXXX")
  awk -v expected="$expected" -v generated_comment="$generated_comment" '
    BEGIN { delimiters = 0; replaced = 0 }
    {
      raw = $0
      line = raw
      ending = ""
      if (sub(/\r$/, "", line)) {
        ending = "\r"
      }

      if (line == "---") {
        if (delimiters == 0) {
          delimiters = 1
          print raw
          next
        }
        if (delimiters == 1) {
          if (!replaced) {
            print generated_comment ending
            print expected ending
          }
          delimiters = 2
          print raw
          next
        }
      }

      if (delimiters == 1 && (line == generated_comment || line ~ /^# Generated from \.github\/MODELS\.md by (\.github\/)?scripts\/sync-agent-models\.sh\. Do not edit\.$/)) {
        next
      }

      if (delimiters == 1 && line ~ /^model:[[:space:]]*/) {
        print generated_comment ending
        print expected ending
        replaced = 1
        next
      }

      print raw
    }
    END {
      if (delimiters < 2) {
        exit 2
      }
    }
  ' "$file" > "$temporary_file"

  if ! cmp -s "$file" "$temporary_file"; then
    mv "$temporary_file" "$file"
    updates=$((updates + 1))
    printf 'SYNC: %s\n' "${file#"$repo_root/"}"
  else
    rm "$temporary_file"
  fi
}

clear_model() {
  local file=$1
  local temporary_file

  temporary_file=$(mktemp "${file}.tmp.XXXXXX")
  awk -v generated_comment="$generated_comment" '
    BEGIN { delimiters = 0 }
    {
      raw = $0
      line = raw
      if (sub(/\r$/, "", line)) {
        ending = "\r"
      } else {
        ending = ""
      }

      if (line == "---") {
        delimiters++
        print raw
        next
      }

      if (delimiters == 1 && (line == generated_comment || line ~ /^# Generated from \.github\/MODELS\.md by (\.github\/)?scripts\/sync-agent-models\.sh\. Do not edit\.$/ || line ~ /^model:[[:space:]]*/)) {
        next
      }

      print raw
    }
    END {
      if (delimiters < 2) {
        exit 2
      }
    }
  ' "$file" > "$temporary_file"

  if ! cmp -s "$file" "$temporary_file"; then
    mv "$temporary_file" "$file"
    updates=$((updates + 1))
    printf 'SYNC: %s\n' "${file#"$repo_root/"}"
  else
    rm "$temporary_file"
  fi
}

process_template() {
  local template=$1
  local models_file="$template/MODELS.md"
  local relative_path file expected current mapping_unconfirmed

  if [[ ! -d "$template" ]]; then
    fail "template directory missing: $template"
    return
  fi
  if [[ ! -f "$models_file" ]]; then
    fail "MODELS.md missing: ${template#"$repo_root/"}"
    return
  fi
  if [[ -L "$models_file" ]]; then
    fail "MODELS.md must not be a symbolic link: ${models_file#"$repo_root/"}"
    return
  fi

  parse_manifest "$models_file"
  mapping_unconfirmed=false
  if grep -Fq 'Mapping status:** UNCONFIRMED STARTER RECOMMENDATIONS' "$models_file"; then
    mapping_unconfirmed=true
  fi

  for relative_path in "${assignment_paths[@]}"; do
    file="$template/$relative_path"
    if has_symlink_component "$template" "$relative_path"; then
      fail "assignment target contains a symbolic link: ${file#"$repo_root/"}"
      continue
    fi
    if [[ ! -f "$file" ]]; then
      fail "manifest target missing: ${file#"$repo_root/"}"
      continue
    fi
    find_assignment "$relative_path"
    if ! find_profile "$resolved_profile"; then
      fail "unknown profile '$resolved_profile' for ${file#"$repo_root/"}"
      continue
    fi

    current=$(frontmatter_model "$file")
    if [[ "$mapping_unconfirmed" == true ]]; then
      if [[ "$check_only" == true ]]; then
        if [[ -n "$current" ]] || frontmatter_has_generated_marker "$file"; then
          fail "unconfirmed model metadata in ${file#"$repo_root/"}"
        fi
      else
        clear_model "$file"
      fi
      continue
    fi

    expected=$(yaml_model_line "$resolved_primary" "$resolved_fallback")
    if [[ "$check_only" == true ]]; then
      if [[ -z "$current" ]]; then
        fail "missing generated model metadata in ${file#"$repo_root/"} (MODELS.md is confirmed)"
      elif [[ "$current" != "$expected" ]]; then
        fail "model value drift in ${file#"$repo_root/"}"
      elif ! frontmatter_has_generated_comment "$file"; then
        fail "generated model marker drift in ${file#"$repo_root/"}"
      fi
    else
      write_model "$file" "$expected"
    fi
  done

  while IFS= read -r -d '' file; do
    relative_path=${file#"$template/"}
    current=$(frontmatter_model "$file")
    if [[ -n "$current" ]] && ! find_assignment "$relative_path"; then
      fail "unmanaged model frontmatter in ${file#"$repo_root/"}"
    fi
  done < <(find "$template" -type f \( -name '*.agent.md' -o -name '*.prompt.md' \) -print0)
}

if [[ "${1:-}" == '--help' || "${1:-}" == '-h' ]]; then
  usage
  exit 0
fi
if [[ "${1:-}" == '--check' ]]; then
  check_only=true
  shift
fi

if (( $# > 0 )); then
  templates=("$@")
else
  templates=("${default_templates[@]}")
fi

for template in "${templates[@]}"; do
  process_template "$template"
done

if (( failures > 0 )); then
  if [[ "$check_only" == true ]]; then
    printf '\n--check is read-only; no files were changed.\n' >&2
    printf 'Repair: rerun the same command without --check.\n' >&2
    printf 'Verify: rerun it with --check after synchronization.\n' >&2
  fi
  printf '\nModel synchronization failed with %d issue(s).\n' "$failures" >&2
  exit 1
fi

if [[ "$check_only" == true ]]; then
  printf 'All generated model frontmatter is synchronized.\n'
else
  printf 'Model synchronization complete: %d file(s) updated.\n' "$updates"
fi