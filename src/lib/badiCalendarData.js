// ── Bahá'í calendar translation data ──
// Event and month translations for every language the app ships
// (en, es, ar, de, fa, fr). Unknown languages fall back to English.

/** Maps canonical English event names to translation keys. */
export const EVENT_KEYS = {
  'Naw-Rúz': 'nawruz',
  'First Day of Riḍván': '1Ridvan',
  'Ninth Day of Riḍván': '9Ridvan',
  'Twelfth Day of Riḍván': '12Ridvan',
  'Declaration of the Báb': 'declarationBab',
  "Ascension of Bahá'u'lláh": 'ascensionB',
  'Martyrdom of the Báb': 'martyrdomBab',
  'Birth of the Báb': 'birthBab',
  "Birth of Bahá'u'lláh": 'birthB',
  'Day of the Covenant': 'covenant',
  "Ascension of 'Abdu'l-Bahá": 'ascensionA',
  'Ayyám-i-Há': 'ayyamiha',
  Fast: 'fast',
};

// Event reference URLs (English / international) reused by languages that
// don't ship localised links (ar, de, fa, fr). en/es keep their own sets.
const EVENT_URLS_INTL = {
  '12Ridvan':
    '\nhttps://www.bahai.org/beliefs/life-spirit/devotion-worship/articles-resources/ridvan',
  '1Ridvan':
    '\nhttps://bahaiteachings.org/bahai-definition-paradise-first-day-ridvan/',
  '9Ridvan':
    '\nhttps://bahaiteachings.org/ninth-day-ridvan-unity-human-family/',
  ascensionA:
    '\nhttps://www.bahai.org/abdul-baha\nhttps://en.wikipedia.org/wiki/Ascension_of_%27Abdu%27l-Bah%C3%A1',
  ascensionB:
    '\nhttps://www.bahai.org/bahaullah\nhttps://bahaiteachings.org/how-bahais-observe-ascension-bahaullah/',
  birthB:
    '\nhttps://www.bahai.org/bahaullah\nhttps://en.wikipedia.org/wiki/Birth_of_Bah%C3%A1%27u%27ll%C3%A1h',
  birthBab:
    '\nhttps://www.bahai.org/the-bab\nhttps://en.wikipedia.org/wiki/Birth_of_the_B%C3%A1b',
  covenant:
    '\nhttps://www.bahai.org/abdul-baha\nhttps://en.wikipedia.org/wiki/Day_of_the_Covenant',
  declarationBab:
    '\nhttps://bahaiteachings.org/declaration-of-bab/\nhttps://www.bahai.org/the-bab',
  martyrdomBab:
    '\nhttps://en.wikipedia.org/wiki/Martyrdom_of_the_B%C3%A1b\nhttps://www.bahai.org/the-bab',
  nawruz: '\nhttps://bahaiteachings.org/naw-ruz-new-day-new-year/',
  '1fast': '\nhttps://bahaiteachings.org/how-to-fast-like-a-bahai/',
  '19fast': '\nhttps://bahaiteachings.org/how-to-fast-like-a-bahai/',
  ayyamiha: '\nhttps://bahaiteachings.org/happy-intercalary-days/',
};

export const TRANSLATIONS = {
  en: {
    events: {
      names: {
        '12Ridvan': 'Twelfth Day of Riḍván',
        '1Ridvan': 'First Day of Riḍván',
        '9Ridvan': 'Ninth Day of Riḍván',
        ascensionA: 'Ascension of ‘Abdu’l-Bahá',
        ascensionB: 'Ascension of Bahá’u’lláh',
        birthB: 'Birth of Bahá’u’lláh',
        birthBab: 'Birth of the Báb',
        covenant: 'Day of the Covenant',
        declarationBab: 'Declaration of the Báb',
        martyrdomBab: 'Martyrdom of the Báb',
        nawruz: 'Naw-Rúz',
        '1fast': 'First day of Fast',
        '19fast': 'Last day of Fast',
      },
      descriptions: {
        '12Ridvan':
          "Twelfth day of Riḍván, the day on which Bahá'u'lláh and His family left the Garden of Riḍván to travel to Constantinople.",
        '1Ridvan':
          "First day of Riḍván, marking the beginning of the Festival of Riḍván. It commemorates Bahá'u'lláh's declaration of His mission as the Messenger of God.",
        '9Ridvan':
          "Ninth day of Riḍván, celebrating the arrival of Bahá'u'lláh's family at the Garden of Riḍván.",
        ascensionA: "Commemoration of the ascension of 'Abdu'l-Bahá (1921).",
        ascensionB: "Commemoration of the ascension of Bahá'u'lláh (1892).",
        birthB: "Celebration of the birth of Bahá'u'lláh (1817).",
        birthBab:
          "Celebration of the birth of the Báb (1819), the precursor of Bahá'u'lláh.",
        covenant:
          "Commemorating Bahá'u'lláh's appointment of His son, 'Abdu'l-Bahá, as the one to whom His followers were to turn after His passing.",
        declarationBab:
          'Commemoration of the day the Báb made known His station as the Messenger of God (1844).',
        martyrdomBab: 'Commemoration of the martyrdom of the Báb (1850).',
        nawruz:
          "Celebration of Naw-Rúz, the Bahá'í New Year. Day 1 of Bahá marks the end of the fasting month of 'Alá and the beginning of a new year and a new month. It is a time of spiritual renewal and joy.",
        '1fast': 'First day of the period of fasting.',
        '19fast': 'Last day of the period of fasting.',
        ayyamiha:
          '(also known as the intercalary days) is a period of celebration dedicated to charity, gift-giving, and festivities before the annual period of fasting.',
      },
      time_notes: {},
      urls: {
        '12Ridvan':
          '\nhttps://www.bahai.org/beliefs/life-spirit/devotion-worship/articles-resources/ridvan',
        '1Ridvan':
          '\nhttps://bahaiteachings.org/bahai-definition-paradise-first-day-ridvan/',
        '9Ridvan':
          '\nhttps://bahaiteachings.org/ninth-day-ridvan-unity-human-family/',
        ascensionA:
          '\nhttps://www.bahai.org/abdul-baha\nhttps://en.wikipedia.org/wiki/Ascension_of_%27Abdu%27l-Bah%C3%A1',
        ascensionB:
          '\nhttps://www.bahai.org/bahaullah\nhttps://bahaiteachings.org/how-bahais-observe-ascension-bahaullah/',
        birthB:
          '\nhttps://www.bahai.org/bahaullah\nhttps://en.wikipedia.org/wiki/Birth_of_Bah%C3%A1%27u%27ll%C3%A1h',
        birthBab:
          '\nhttps://www.bahai.org/the-bab\nhttps://en.wikipedia.org/wiki/Birth_of_the_B%C3%A1b',
        covenant:
          '\nhttps://www.bahai.org/abdul-baha\nhttps://en.wikipedia.org/wiki/Day_of_the_Covenant',
        declarationBab:
          '\nhttps://bahaiteachings.org/declaration-of-bab/\nhttps://www.bahai.org/the-bab',
        martyrdomBab:
          '\nhttps://en.wikipedia.org/wiki/Martyrdom_of_the_B%C3%A1b\nhttps://www.bahai.org/the-bab',
        nawruz: '\nhttps://bahaiteachings.org/naw-ruz-new-day-new-year/',
        '1fast': '\nhttps://bahaiteachings.org/how-to-fast-like-a-bahai/',
        '19fast': '\nhttps://bahaiteachings.org/how-to-fast-like-a-bahai/',
        ayyamiha: '\nhttps://bahaiteachings.org/happy-intercalary-days/',
      },
    },
    month: {
      names: {
        0: 'Intercalary days',
        1: 'Splendour',
        2: 'Glory',
        3: 'Beauty',
        4: 'Grandeur',
        5: 'Light',
        6: 'Mercy',
        7: 'Words',
        8: 'Perfection',
        9: 'Names',
        10: 'Might',
        11: 'Will',
        12: 'Knowledge',
        13: 'Power',
        14: 'Speech',
        15: 'Questions',
        16: 'Honour',
        17: 'Sovereignty',
        18: 'Dominion',
        19: 'Loftiness',
      },
      descriptions: {
        0: "Literally, Days of Há. The intercalary days are 4 days (5 in leap years) preceding the last Bahá'í month of the year, 'Alá, the month of fasting. Bahá'u'lláh designated the intercalary days as Ayyám-i-Há in the Kitáb-i-Aqdas and specified when they were to occur; the Báb left this undetermined. The days of Ayyám-i-Há are a spiritual preparation for the Fast, days of hospitality, charity, and the giving of gifts to one another. “Let the days in excess of the months be placed before the month of fasting. We have ordained that these, amid all nights and days, be the manifestations of the letter Há, and thus they are not restricted by the limits of the year and its months.” (Bahá'u'lláh, The Kitáb-i-Aqdas, excerpt from paragraph 16).",
        1: 'It is the first month of the year. With it begins the first Spiritual Period, the Glorification of God, the Fire of divine love kindled in hearts.',
        2: 'Month of Glory.',
        3: 'End of the first Spiritual Period, the Glorification of God.',
        4: 'With it begins the second Spiritual Period, the Praise of God: the Creation of contingent spirits, spiritual sustenance.',
        5: 'Month of Light.',
        6: 'Month of Mercy.',
        7: 'End of the second Spiritual Period, the Praise of God.',
        8: 'Begins the third Spiritual Period, the declaration of Unity in Diversity: death to denial and life in assent.',
        9: 'Month of Names.',
        10: 'Month of Might.',
        11: 'Month of Will.',
        12: 'Month of Knowledge.',
        13: 'End of the third Spiritual Period, the Declaration of Unity in Diversity.',
        14: 'Beginning of the fourth and last Spiritual Period, the Exaltation of God: the quickening of those who have died to all but God and have remained steadfast in His love.',
        15: 'Month of Questions.',
        16: 'Month of Honour.',
        17: 'Month of Sovereignty.',
        18: 'Month of Dominion.',
        19: 'It is the nineteenth month, the last of the year. End of the fourth Spiritual Period, the Exaltation of God.',
      },
      info: 'Starts at sunset the previous day',
    },
    title: '19 Day Feast',
  },
  es: {
    events: {
      names: {
        '12Ridvan': 'Duodécimo Día de Riḍván',
        '1Ridvan': 'Primer Día de Riḍván',
        '9Ridvan': 'Noveno Día de Riḍván',
        ascensionA: 'Ascensión de ‘Abdu’l-Bahá',
        ascensionB: 'Ascensión de Bahá’u’lláh',
        birthB: 'Nacimiento de Bahá’u’lláh',
        birthBab: 'Nacimiento del Báb',
        covenant: 'Día de la Alianza',
        declarationBab: 'Declaración del Báb',
        martyrdomBab: 'Martirio del Báb',
        nawruz: 'Naw-Rúz',
        '1fast': 'Primer día de Ayuno',
        '19fast': 'Último día de Ayuno',
      },
      descriptions: {
        '12Ridvan':
          'Duodécimo día de Riḍván, día en que Bahá’u’lláh y su familia dejaron el Jardín de Riḍván para viajar a Constantinopla.',
        '1Ridvan':
          "Primer día de Riḍván, que marca el inicio del Festival de Riḍván. Conmemora la declaración de Bahá'u'lláh de Su misión como Mensajero de Dios.",
        '9Ridvan':
          'Noveno día de Riḍván, se celebra la llegada de los familiares de Bahá’u’lláh al Jardín de Riḍván.',
        ascensionA: "Conmemoración de la ascensión de 'Abdu'l-Bahá (1921).",
        ascensionB: "Conmemoración de la ascensión de Bahá'u'lláh (1892).",
        birthB: 'Celebración del nacimiento de Bahá’u’lláh (1817).',
        birthBab:
          'Celebración del nacimiento del Báb (1819), el precursor de Bahá’u’lláh.',
        covenant:
          'Conmemorando el nombramiento por parte de Bahá’u’lláh de su hijo, ‘Abdu’l-Bahá, como aquel a quien sus seguidores debían acudir tras su fallecimiento.',
        declarationBab:
          'Se conmemora el día en que el Báb dió a conocer Su condición como Mensajero de Dios (1844).',
        martyrdomBab: 'Conmemoración del martirio del Báb (1850).',
        nawruz:
          "Celebración de Naw-Rúz, el Año Nuevo Bahá'í. El día 1 de Bahá culmina el mes 'Alá mes de ayuno, y comienza un año nuevo y un nuevo mes. Es un momento de renovación espiritual y alegría.",
        '1fast': 'Primer día de período de ayuno.',
        '19fast': 'Último día de período de ayuno.',
        ayyamiha:
          '(también conocido como los días intercalares) es un período de celebración dedicado a la caridad, los regalos y las festividades antes del período anual de ayuno.',
      },
      time_notes: {
        '1Ridvan': 'A las cuatro de la tarde',
        ascensionA: 'A la una de la madrugada',
        ascensionB: 'A las cuatro de la madrugada',
        declarationBab: 'Dos horas tras la puesta del sol del día anterior',
        martyrdomBab: 'A la una de la tarde',
      },
      urls: {
        '12Ridvan':
          '\nhttps://bahaiteachings.org/es/celebrando-el-duodecimo-dia-de-ridvan/',
        '1Ridvan':
          '\nhttps://bahaiteachings.org/es/la-definicion-bahai-de-paraiso-el-primer-dia-de-ridvan/',
        '9Ridvan':
          '\nhttps://bahaiteachings.org/es/el-noveno-dia-de-ridvan-la-unidad-de-la-familia-humana/',
        ascensionA:
          '\nhttps://www.bahai.org/es/abdul-baha\nhttps://bahaiteachings.org/es/celebrando-a-abdul-baha-y-observando-su-ascension/',
        ascensionB:
          '\nhttps://bibliotecabahai.com/index.php/temas/otros-autores/2512-h-m-balyuzi-ascension-de-baha-u-llah/file\nhttps://www.bahai.org/es/bahaullah\nhttps://bahaiteachings.org/es/como-los-bahais-observan-la-ascension-de-bahaullah/',
        birthB:
          '\nhttps://www.bahai.org/es/bahaullah\nhttps://bahaiteachings.org/es/celebrando-con-alegria-el-nacimiento-de-bahaullah/',
        birthBab:
          '\nhttps://www.bahai.org/es/the-bab\nhttps://bibliotecabahai.com/index.php/documents/otros-autores/2375-el-bab-el-precursor-de-baha-u-llah/file',
        covenant:
          '\nhttps://www.bahai.org/es/abdul-baha\nhttps://bibliotecabahai.com/index.php/temas/otros-autores/2513-h-m-balyuzi-el-dia-de-la-alianza/file',
        declarationBab:
          '\nhttps://bahaiteachings.org/es/como-empezo-la-fe-bahai-la-declaracion-del-bab/\nhttps://www.bahai.org/es/the-bab',
        martyrdomBab:
          '\nhttps://bibliotecabahai.com/index.php/temas/otros-autores-2/3361-to-martirio-del-bab/file\nhttps://www.bahai.org/es/the-bab',
        nawruz:
          '\nhttps://bahaiteachings.org/es/naw-ruz-es-un-nuevo-dia-y-un-nuevo-ano/',
        '1fast':
          '\nhttps://bahaiteachings.org/es/como-ayunar-al-igual-que-un-bahai-en-2021/',
        '19fast':
          '\nhttps://bahaiteachings.org/es/como-ayunar-al-igual-que-un-bahai-en-2021/',
        ayyamiha:
          '\nhttps://bahaiteachings.org/es/feliz-ayyamiha-dias-regalos-reuniones-servicio/',
      },
    },
    month: {
      names: {
        0: 'Días intercalares',
        1: 'Esplendor',
        2: 'Gloria',
        3: 'Belleza',
        4: 'Grandeza',
        5: 'Luz',
        6: 'Misericordia',
        7: 'Palabras',
        8: 'Perfección',
        9: 'Nombres',
        10: 'Poderío',
        11: 'Voluntad',
        12: 'Conocimiento',
        13: 'Poder',
        14: 'Discurso',
        15: 'Preguntas',
        16: 'Honor',
        17: 'Soberanía',
        18: 'Dominio',
        19: 'Sublimidad',
      },
      descriptions: {
        0: "Literalmente, Días de Há. Los días intercalares son 4 días (5 en años bisiestos) antes del último mes Bahá'í del año, 'Alá', que es el mes del ayuno. Bahá'u'lláh designó los días intercalares como Ayyám-i-Há en el Kitáb-i-Aqdas y especificó cuándo debían ser; El Bab dejó esto indefinido. Los días de Ayyám-i-Há son una preparación espiritual para el ayuno, días de hospitalidad, caridad y de dar se regalos unos a otros. Que los días sobrantes de los meses se coloquen antes del mes de ayuno. Hemos ordenado que éstos, entre todos los días y las noches, sean las manifestaciones de la letra Há, y por ello no quedan sujetos a los límites del año y sus meses. (Bahá'u'lláh, The Kitab-i-Aqdas, fragmento del párrafo 16).",
        1: 'Es el primer mes del año. Con el comienza el primer Periodo Espiritual, Glorificación de Dios, Fuego del amor divino encendido en los corazones',
        2: '',
        3: 'Fin del primer Periodo Espiritual, Glorificación de Dios.',
        4: 'Con él comienza el segundo Periodo Espiritual, Alabanza de Dios: Creación de los espíritus contingentes, sustento espiritual.',
        5: '',
        6: '',
        7: 'Fin del segundo Período Espiritual, Alabanza de Dios.',
        8: 'Comienza el tercer Período Espiritual, declaración de la Unidad Diversidad: Muerte a la negación y vida en el asentimiento.',
        9: '',
        10: '',
        11: '',
        12: '',
        13: 'Fin del tercer Periodo Espiritual, Declaración de la Unidad Diversidad.',
        14: 'Inicio del cuarto y último Periodo Espiritual, Enaltecimiento de Dios: Vivificación de quienes han muerto a todos más que Dios y se han mantenido firmes en Su Amor.',
        15: '',
        16: '',
        17: '',
        18: '',
        19: 'Es el mes número 19, el último del año. Fin del cuarto Periodo Espiritual, Enaltecimiento de Dios.',
      },
      info: 'Comienza en el atardecer del día anterior',
    },
    title: 'Fiesta de 19 Días',
  },
  ar: {
    events: {
      names: {
        '12Ridvan': 'اليوم الثاني عشر من الرضوان',
        '1Ridvan': 'اليوم الأول من الرضوان',
        '9Ridvan': 'اليوم التاسع من الرضوان',
        ascensionA: 'صعود عبد البهاء',
        ascensionB: 'صعود بهاء الله',
        birthB: 'مولد بهاء الله',
        birthBab: 'مولد الباب',
        covenant: 'يوم العهد والميثاق',
        declarationBab: 'إعلان الباب',
        martyrdomBab: 'استشهاد الباب',
        nawruz: 'نوروز',
        '1fast': 'اليوم الأول من الصيام',
        '19fast': 'اليوم الأخير من الصيام',
      },
      descriptions: {
        '12Ridvan':
          'اليوم الثاني عشر من الرضوان، اليوم الذي غادر فيه بهاء الله وعائلته حديقة الرضوان للسفر إلى القسطنطينية.',
        '1Ridvan':
          'اليوم الأول من الرضوان، الذي يصادف بداية عيد الرضوان. يُحيي ذكرى إعلان بهاء الله رسالته بوصفه رسول الله.',
        '9Ridvan':
          'اليوم التاسع من الرضوان، احتفالاً بوصول عائلة بهاء الله إلى حديقة الرضوان.',
        ascensionA: 'إحياء ذكرى صعود عبد البهاء (1921).',
        ascensionB: 'إحياء ذكرى صعود بهاء الله (1892).',
        birthB: 'الاحتفال بمولد بهاء الله (1817).',
        birthBab: 'الاحتفال بمولد الباب (1819)، مبشّر بهاء الله.',
        covenant:
          'إحياء ذكرى تعيين بهاء الله لابنه، عبد البهاء، ليكون مرجع أتباعه بعد وفاته.',
        declarationBab:
          'إحياء ذكرى اليوم الذي أعلن فيه الباب عن مقامه رسولاً من عند الله (1844).',
        martyrdomBab: 'إحياء ذكرى استشهاد الباب (1850).',
        nawruz:
          'الاحتفال بعيد النوروز، رأس السنة البهائية. يصادف اليوم الأول من شهر البهاء نهاية شهر الصيام (العلاء) وبداية سنة جديدة وشهر جديد. إنه وقت للتجدد الروحي والفرح.',
        '1fast': 'اليوم الأول من فترة الصيام.',
        '19fast': 'اليوم الأخير من فترة الصيام.',
        ayyamiha:
          '(المعروفة أيضاً بأيام الهاء) هي فترة احتفال مخصصة للإحسان والهدايا والاحتفالات قبل فترة الصيام السنوية.',
      },
      time_notes: {
        '1Ridvan': 'في الساعة الرابعة بعد الظهر',
        ascensionA: 'في الساعة الواحدة بعد منتصف الليل',
        ascensionB: 'في الساعة الرابعة فجراً',
        declarationBab: 'بعد ساعتين من غروب شمس اليوم السابق',
        martyrdomBab: 'في الساعة الواحدة بعد الظهر',
      },
      urls: EVENT_URLS_INTL,
    },
    month: {
      names: {
        0: 'أيام الهاء',
        1: 'البهاء',
        2: 'الجلال',
        3: 'الجمال',
        4: 'العظمة',
        5: 'النور',
        6: 'الرحمة',
        7: 'الكلمات',
        8: 'الكمال',
        9: 'الأسماء',
        10: 'العزة',
        11: 'المشيئة',
        12: 'العلم',
        13: 'القدرة',
        14: 'القول',
        15: 'المسائل',
        16: 'الشرف',
        17: 'السلطان',
        18: 'الملك',
        19: 'العلاء',
      },
      descriptions: {
        0: 'حرفياً، أيام الهاء. الأيام المُدرَجة هي 4 أيام (5 في السنوات الكبيسة) تسبق آخر شهر بهائي من السنة، وهو شهر العلاء، شهر الصيام. حدد بهاء الله الأيام المُدرَجة باسم أيام الهاء في الكتاب الأقدس وبيّن موعدها؛ بينما تركها الباب غير محددة. أيام الهاء هي استعداد روحي للصيام، أيام للضيافة والإحسان وتبادل الهدايا. «لتوضع الأيام الزائدة عن الشهور قبل شهر الصيام. لقد قدّرنا أن تكون هذه الأيام، بين جميع الأيام والليالي، مظاهر لحرف الهاء، ولذلك فهي غير خاضعة لحدود السنة وشهورها» (بهاء الله، الكتاب الأقدس، مقتطف من الفقرة 16).',
        1: 'إنه الشهر الأول من السنة. وبه تبدأ الفترة الروحية الأولى، تمجيد الله، نار المحبة الإلهية المشتعلة في القلوب.',
        2: 'شهر الجلال.',
        3: 'نهاية الفترة الروحية الأولى، تمجيد الله.',
        4: 'معه تبدأ الفترة الروحية الثانية، حمد الله: خلق الأرواح الممكنة، القوت الروحي.',
        5: 'شهر النور.',
        6: 'شهر الرحمة.',
        7: 'نهاية الفترة الروحية الثانية، حمد الله.',
        8: 'تبدأ الفترة الروحية الثالثة، إعلان الوحدة في التنوع: الموت للإنكار والحياة في القبول.',
        9: 'شهر الأسماء.',
        10: 'شهر العزة.',
        11: 'شهر المشيئة.',
        12: 'شهر العلم.',
        13: 'نهاية الفترة الروحية الثالثة، إعلان الوحدة في التنوع.',
        14: 'بداية الفترة الروحية الرابعة والأخيرة، تعظيم الله: إحياء الذين ماتوا عن كل شيء سوى الله وثبتوا في محبته.',
        15: 'شهر المسائل.',
        16: 'شهر الشرف.',
        17: 'شهر السلطان.',
        18: 'شهر الملك.',
        19: 'إنه الشهر التاسع عشر، آخر شهر في السنة. نهاية الفترة الروحية الرابعة، تعظيم الله.',
      },
      info: 'يبدأ عند غروب شمس اليوم السابق',
    },
    title: 'عيد التسعة عشر يوماً',
  },
  de: {
    events: {
      names: {
        '12Ridvan': 'Zwölfter Tag von Riḍván',
        '1Ridvan': 'Erster Tag von Riḍván',
        '9Ridvan': 'Neunter Tag von Riḍván',
        ascensionA: 'Hinscheiden ‘Abdu’l-Bahás',
        ascensionB: 'Hinscheiden Bahá’u’lláhs',
        birthB: 'Geburt Bahá’u’lláhs',
        birthBab: 'Geburt des Báb',
        covenant: 'Tag des Bundes',
        declarationBab: 'Erklärung des Báb',
        martyrdomBab: 'Martyrium des Báb',
        nawruz: 'Naw-Rúz',
        '1fast': 'Erster Fastentag',
        '19fast': 'Letzter Fastentag',
      },
      descriptions: {
        '12Ridvan':
          'Zwölfter Tag von Riḍván, der Tag, an dem Bahá’u’lláh und Seine Familie den Garten von Riḍván verließen, um nach Konstantinopel zu reisen.',
        '1Ridvan':
          'Erster Tag von Riḍván, der den Beginn des Riḍván-Festes markiert. Er erinnert an Bahá’u’lláhs Erklärung Seiner Sendung als Bote Gottes.',
        '9Ridvan':
          'Neunter Tag von Riḍván, an dem die Ankunft der Familie Bahá’u’lláhs im Garten von Riḍván gefeiert wird.',
        ascensionA: 'Gedenken an das Hinscheiden ‘Abdu’l-Bahás (1921).',
        ascensionB: 'Gedenken an das Hinscheiden Bahá’u’lláhs (1892).',
        birthB: 'Feier der Geburt Bahá’u’lláhs (1817).',
        birthBab:
          'Feier der Geburt des Báb (1819), des Vorläufers Bahá’u’lláhs.',
        covenant:
          'Gedenken an die Bestimmung Bahá’u’lláhs, dass Sein Sohn ‘Abdu’l-Bahá derjenige sein sollte, an den sich Seine Anhänger nach Seinem Hinscheiden wenden sollten.',
        declarationBab:
          'Gedenken an den Tag, an dem der Báb Seine Stellung als Bote Gottes bekannt gab (1844).',
        martyrdomBab: 'Gedenken an das Martyrium des Báb (1850).',
        nawruz:
          'Feier von Naw-Rúz, dem Bahá’í-Neujahr. Der erste Tag des Monats Bahá markiert das Ende des Fastenmonats ‘Alá und den Beginn eines neuen Jahres und eines neuen Monats. Es ist eine Zeit geistiger Erneuerung und Freude.',
        '1fast': 'Erster Tag der Fastenzeit.',
        '19fast': 'Letzter Tag der Fastenzeit.',
        ayyamiha:
          '(auch bekannt als die Schalttage) ist eine Zeit der Feier, die der Nächstenliebe, dem Schenken und Festlichkeiten vor der jährlichen Fastenzeit gewidmet ist.',
      },
      time_notes: {
        '1Ridvan': 'Um vier Uhr nachmittags',
        ascensionA: 'Um ein Uhr morgens',
        ascensionB: 'Um vier Uhr morgens',
        declarationBab: 'Zwei Stunden nach Sonnenuntergang des Vortages',
        martyrdomBab: 'Um ein Uhr nachmittags',
      },
      urls: EVENT_URLS_INTL,
    },
    month: {
      names: {
        0: 'Schalttage',
        1: 'Glanz',
        2: 'Herrlichkeit',
        3: 'Schönheit',
        4: 'Größe',
        5: 'Licht',
        6: 'Barmherzigkeit',
        7: 'Worte',
        8: 'Vollkommenheit',
        9: 'Namen',
        10: 'Macht',
        11: 'Wille',
        12: 'Wissen',
        13: 'Kraft',
        14: 'Rede',
        15: 'Fragen',
        16: 'Ehre',
        17: 'Souveränität',
        18: 'Herrschaft',
        19: 'Erhabenheit',
      },
      descriptions: {
        0: 'Wörtlich: Tage des Há. Die Schalttage sind 4 Tage (5 in Schaltjahren) vor dem letzten Bahá’í-Monat des Jahres, ‘Alá, dem Fastenmonat. Bahá’u’lláh bestimmte die Schalttage als Ayyám-i-Há im Kitáb-i-Aqdas und legte fest, wann sie stattfinden sollten; der Báb ließ dies offen. Die Tage von Ayyám-i-Há sind eine geistige Vorbereitung auf das Fasten, Tage der Gastfreundschaft, der Nächstenliebe und des gegenseitigen Beschenkens. „Die über die Monate hinausgehenden Tage sollen vor den Fastenmonat gesetzt werden. Wir haben verordnet, dass diese, inmitten aller Tage und Nächte, die Erscheinungsformen des Buchstabens Há seien, und daher sind sie nicht an die Grenzen des Jahres und seiner Monate gebunden.“ (Bahá’u’lláh, Kitáb-i-Aqdas, Auszug aus Absatz 16).',
        1: 'Es ist der erste Monat des Jahres. Mit ihm beginnt die erste Geistige Periode, die Verherrlichung Gottes, das Feuer der göttlichen Liebe, das in den Herzen entzündet wird.',
        2: 'Monat der Herrlichkeit.',
        3: 'Ende der ersten Geistigen Periode, der Verherrlichung Gottes.',
        4: 'Mit ihm beginnt die zweite Geistige Periode, das Lob Gottes: die Erschaffung der bedingten Geister, geistige Nahrung.',
        5: 'Monat des Lichts.',
        6: 'Monat der Barmherzigkeit.',
        7: 'Ende der zweiten Geistigen Periode, des Lobes Gottes.',
        8: 'Beginn der dritten Geistigen Periode, der Erklärung der Einheit in der Vielfalt: Tod der Verleugnung und Leben in der Zustimmung.',
        9: 'Monat der Namen.',
        10: 'Monat der Macht.',
        11: 'Monat des Willens.',
        12: 'Monat des Wissens.',
        13: 'Ende der dritten Geistigen Periode, der Erklärung der Einheit in der Vielfalt.',
        14: 'Beginn der vierten und letzten Geistigen Periode, der Erhöhung Gottes: die Belebung derer, die allem außer Gott gestorben sind und in Seiner Liebe standhaft geblieben sind.',
        15: 'Monat der Fragen.',
        16: 'Monat der Ehre.',
        17: 'Monat der Souveränität.',
        18: 'Monat der Herrschaft.',
        19: 'Es ist der neunzehnte Monat, der letzte des Jahres. Ende der vierten Geistigen Periode, der Erhöhung Gottes.',
      },
      info: 'Beginnt bei Sonnenuntergang des Vortages',
    },
    title: 'Neunzehntagefest',
  },
  fa: {
    events: {
      names: {
        '12Ridvan': 'دوازدهمین روز عید رضوان',
        '1Ridvan': 'نخستین روز عید رضوان',
        '9Ridvan': 'نهمین روز عید رضوان',
        ascensionA: 'صعود حضرت عبدالبهاء',
        ascensionB: 'صعود حضرت بهاءالله',
        birthB: 'میلاد حضرت بهاءالله',
        birthBab: 'میلاد حضرت باب',
        covenant: 'روز میثاق',
        declarationBab: 'بعثت حضرت باب',
        martyrdomBab: 'شهادت حضرت باب',
        nawruz: 'نوروز',
        '1fast': 'نخستین روز روزه',
        '19fast': 'آخرین روز روزه',
      },
      descriptions: {
        '12Ridvan':
          'دوازدهمین روز رضوان، روزی که حضرت بهاءالله و خانواده‌اش باغ رضوان را به قصد سفر به قسطنطنیه ترک کردند.',
        '1Ridvan':
          'نخستین روز رضوان، که آغاز عید رضوان را نشان می‌دهد. یادآور اعلام رسالت حضرت بهاءالله به‌عنوان پیام‌آور الهی است.',
        '9Ridvan':
          'نهمین روز رضوان، جشن ورود خانواده حضرت بهاءالله به باغ رضوان.',
        ascensionA: 'یادبود صعود حضرت عبدالبهاء (۱۹۲۱).',
        ascensionB: 'یادبود صعود حضرت بهاءالله (۱۸۹۲).',
        birthB: 'جشن میلاد حضرت بهاءالله (۱۸۱۷).',
        birthBab: 'جشن میلاد حضرت باب (۱۸۱۹)، مبشّر حضرت بهاءالله.',
        covenant:
          'یادبود تعیین حضرت بهاءالله فرزندش، حضرت عبدالبهاء، به‌عنوان کسی که پیروانش پس از صعود ایشان باید به او رجوع کنند.',
        declarationBab:
          'یادبود روزی که حضرت باب مقام خود را به‌عنوان پیام‌آور الهی آشکار ساختند (۱۸۴۴).',
        martyrdomBab: 'یادبود شهادت حضرت باب (۱۸۵۰).',
        nawruz:
          'جشن نوروز، آغاز سال نو بهائی. روز نخست ماه بهاء پایان ماه روزه، یعنی ماه علاء، و آغاز سالی نو و ماهی نو است. زمانی برای تجدید روحانی و شادی.',
        '1fast': 'نخستین روز دورهٔ روزه.',
        '19fast': 'آخرین روز دورهٔ روزه.',
        ayyamiha:
          '(که به ایام هاء نیز شناخته می‌شود) دوره‌ای از جشن است که به نیکوکاری، هدیه دادن و برگزاری جشن‌ها پیش از دورهٔ سالانه روزه اختصاص دارد.',
      },
      time_notes: {
        '1Ridvan': 'ساعت چهار بعدازظهر',
        ascensionA: 'ساعت یک بامداد',
        ascensionB: 'ساعت چهار بامداد',
        declarationBab: 'دو ساعت پس از غروب آفتابِ روز پیش',
        martyrdomBab: 'ساعت یک بعدازظهر',
      },
      urls: EVENT_URLS_INTL,
    },
    month: {
      names: {
        0: 'ایام هاء',
        1: 'بهاء',
        2: 'جلال',
        3: 'جمال',
        4: 'عظمت',
        5: 'نور',
        6: 'رحمت',
        7: 'کلمات',
        8: 'کمال',
        9: 'اسماء',
        10: 'عزّت',
        11: 'مشیت',
        12: 'علم',
        13: 'قدرت',
        14: 'قول',
        15: 'مسائل',
        16: 'شرف',
        17: 'سلطان',
        18: 'مُلک',
        19: 'علاء',
      },
      descriptions: {
        0: 'به معنای واقعی کلمه، ایام هاء. ایام هاء (روزهای افزوده) ۴ روز (۵ روز در سال‌های کبیسه) پیش از آخرین ماه بهائی سال، یعنی ماه علاء، ماه روزه، قرار دارند. حضرت بهاءالله این ایام را در کتاب اقدس با نام ایام هاء تعیین فرمودند و زمان آن‌ها را مشخص کردند؛ حضرت باب این موضوع را نامعین گذاشته بودند. ایام هاء آماده‌سازی روحانی برای روزه است، روزهایی برای مهمان‌نوازی، نیکوکاری و هدیه دادن به یکدیگر. «باید روزهای اضافه بر ماه‌ها پیش از ماه روزه قرار گیرد. ما مقرر داشتیم که این روزها، در میان همهٔ شب‌ها و روزها، مظاهر حرف هاء باشند و از این رو محدود به حدود سال و ماه‌های آن نیستند» (حضرت بهاءالله، کتاب اقدس، برگرفته از بند ۱۶).',
        1: 'این نخستین ماه سال است. با آن نخستین دورهٔ روحانی، تمجید خداوند، آتش عشق الهی افروخته در دل‌ها، آغاز می‌شود.',
        2: 'ماه جلال.',
        3: 'پایان نخستین دورهٔ روحانی، تمجید خداوند.',
        4: 'با آن دورهٔ روحانی دوم آغاز می‌شود، ستایش خداوند: آفرینش ارواح ممکنه، قوت روحانی.',
        5: 'ماه نور.',
        6: 'ماه رحمت.',
        7: 'پایان دورهٔ روحانی دوم، ستایش خداوند.',
        8: 'دورهٔ روحانی سوم آغاز می‌شود، اعلام وحدت در تنوع: مرگ انکار و زندگی در پذیرش.',
        9: 'ماه اسماء.',
        10: 'ماه عزّت.',
        11: 'ماه مشیت.',
        12: 'ماه علم.',
        13: 'پایان دورهٔ روحانی سوم، اعلام وحدت در تنوع.',
        14: 'آغاز چهارمین و آخرین دورهٔ روحانی، تعالی خداوند: زنده‌سازی کسانی که نسبت به همه چیز جز خدا مرده‌اند و در محبت او پایدار مانده‌اند.',
        15: 'ماه مسائل.',
        16: 'ماه شرف.',
        17: 'ماه سلطان.',
        18: 'ماه مُلک.',
        19: 'این نوزدهمین ماه، آخرین ماه سال است. پایان دورهٔ روحانی چهارم، تعالی خداوند.',
      },
      info: 'از غروب روز قبل آغاز می‌شود',
    },
    title: 'ضیافت نوزده‌روزه',
  },
  fr: {
    events: {
      names: {
        '12Ridvan': 'Douzième jour de Riḍván',
        '1Ridvan': 'Premier jour de Riḍván',
        '9Ridvan': 'Neuvième jour de Riḍván',
        ascensionA: 'Ascension de ‘Abdu’l-Bahá',
        ascensionB: 'Ascension de Bahá’u’lláh',
        birthB: 'Naissance de Bahá’u’lláh',
        birthBab: 'Naissance du Báb',
        covenant: 'Jour de l’Alliance',
        declarationBab: 'Déclaration du Báb',
        martyrdomBab: 'Martyre du Báb',
        nawruz: 'Naw-Rúz',
        '1fast': 'Premier jour du Jeûne',
        '19fast': 'Dernier jour du Jeûne',
      },
      descriptions: {
        '12Ridvan':
          'Douzième jour de Riḍván, jour où Bahá’u’lláh et Sa famille quittèrent le Jardin de Riḍván pour se rendre à Constantinople.',
        '1Ridvan':
          'Premier jour de Riḍván, marquant le début de la Fête de Riḍván. Il commémore la déclaration de Bahá’u’lláh de Sa mission en tant que Messager de Dieu.',
        '9Ridvan':
          'Neuvième jour de Riḍván, célébrant l’arrivée de la famille de Bahá’u’lláh au Jardin de Riḍván.',
        ascensionA: 'Commémoration de l’ascension de ‘Abdu’l-Bahá (1921).',
        ascensionB: 'Commémoration de l’ascension de Bahá’u’lláh (1892).',
        birthB: 'Célébration de la naissance de Bahá’u’lláh (1817).',
        birthBab:
          'Célébration de la naissance du Báb (1819), le précurseur de Bahá’u’lláh.',
        covenant:
          'Commémoration de la désignation par Bahá’u’lláh de Son fils, ‘Abdu’l-Bahá, comme celui vers qui Ses disciples devaient se tourner après Son décès.',
        declarationBab:
          'Commémoration du jour où le Báb fit connaître Sa condition de Messager de Dieu (1844).',
        martyrdomBab: 'Commémoration du martyre du Báb (1850).',
        nawruz:
          'Célébration de Naw-Rúz, le Nouvel An bahá’í. Le premier jour du mois de Bahá marque la fin du mois de jeûne d’Alá et le début d’une nouvelle année et d’un nouveau mois. C’est un moment de renouveau spirituel et de joie.',
        '1fast': 'Premier jour de la période de jeûne.',
        '19fast': 'Dernier jour de la période de jeûne.',
        ayyamiha:
          '(également connus sous le nom de jours intercalaires) est une période de célébration consacrée à la charité, aux dons et aux festivités avant la période annuelle de jeûne.',
      },
      time_notes: {
        '1Ridvan': 'À quatre heures de l’après-midi',
        ascensionA: 'À une heure du matin',
        ascensionB: 'À quatre heures du matin',
        declarationBab: 'Deux heures après le coucher du soleil de la veille',
        martyrdomBab: 'À une heure de l’après-midi',
      },
      urls: EVENT_URLS_INTL,
    },
    month: {
      names: {
        0: 'Jours intercalaires',
        1: 'Splendeur',
        2: 'Gloire',
        3: 'Beauté',
        4: 'Grandeur',
        5: 'Lumière',
        6: 'Miséricorde',
        7: 'Paroles',
        8: 'Perfection',
        9: 'Noms',
        10: 'Puissance',
        11: 'Volonté',
        12: 'Connaissance',
        13: 'Pouvoir',
        14: 'Discours',
        15: 'Questions',
        16: 'Honneur',
        17: 'Souveraineté',
        18: 'Domination',
        19: 'Élévation',
      },
      descriptions: {
        0: 'Littéralement, Jours de Há. Les jours intercalaires sont 4 jours (5 les années bissextiles) précédant le dernier mois bahá’í de l’année, ‘Alá, le mois du jeûne. Bahá’u’lláh désigna les jours intercalaires sous le nom d’Ayyám-i-Há dans le Kitáb-i-Aqdas et en précisa la période ; le Báb avait laissé ce point indéterminé. Les jours d’Ayyám-i-Há sont une préparation spirituelle au jeûne, des jours d’hospitalité, de charité et d’échange de cadeaux. « Que les jours excédant les mois soient placés avant le mois de jeûne. Nous avons ordonné que ceux-ci, parmi tous les jours et les nuits, soient les manifestations de la lettre Há, et qu’ils ne soient donc pas soumis aux limites de l’année et de ses mois. » (Bahá’u’lláh, le Kitáb-i-Aqdas, extrait du paragraphe 16).',
        1: 'C’est le premier mois de l’année. Avec lui commence la première Période Spirituelle, la Glorification de Dieu, le Feu de l’amour divin allumé dans les cœurs.',
        2: 'Mois de la Gloire.',
        3: 'Fin de la première Période Spirituelle, la Glorification de Dieu.',
        4: 'Avec lui commence la deuxième Période Spirituelle, la Louange de Dieu : la Création des esprits contingents, la subsistance spirituelle.',
        5: 'Mois de la Lumière.',
        6: 'Mois de la Miséricorde.',
        7: 'Fin de la deuxième Période Spirituelle, la Louange de Dieu.',
        8: 'Commence la troisième Période Spirituelle, la déclaration de l’Unité dans la Diversité : mort au déni et vie dans l’assentiment.',
        9: 'Mois des Noms.',
        10: 'Mois de la Puissance.',
        11: 'Mois de la Volonté.',
        12: 'Mois de la Connaissance.',
        13: 'Fin de la troisième Période Spirituelle, la Déclaration de l’Unité dans la Diversité.',
        14: 'Début de la quatrième et dernière Période Spirituelle, l’Exaltation de Dieu : la vivification de ceux qui sont morts à tout sauf à Dieu et sont demeurés fermes dans Son amour.',
        15: 'Mois des Questions.',
        16: 'Mois de l’Honneur.',
        17: 'Mois de la Souveraineté.',
        18: 'Mois de la Domination.',
        19: 'C’est le dix-neuvième mois, le dernier de l’année. Fin de la quatrième Période Spirituelle, l’Exaltation de Dieu.',
      },
      info: 'Commence au coucher du soleil du jour précédent',
    },
    title: 'Fête des dix-neuf jours',
  },
};

/** Bahá'í month transliterations — language-independent. */
export const MONTHNAMES = {
  1: 'Bahá',
  2: 'Jalál',
  3: 'Jamál',
  4: "'Aẓamat",
  5: 'Núr',
  6: 'Raḥmat',
  7: 'Kalimát',
  8: 'Kamál',
  9: "Asmá'",
  10: "'Izzat",
  11: 'Mashíyyat',
  12: "'Ilm",
  13: 'Qudrat',
  14: 'Qawl',
  15: 'Masá’il',
  16: 'Sharaf',
  17: 'Sulṭán',
  18: 'Mulk',
  0: 'Ayyám-i-Há',
  19: "'Alá'",
};

/**
 * Resolve the translation bundle for a requested language, falling back to
 * English for any language the app doesn't ship.
 */
export function resolveTranslations(lang = 'es') {
  return TRANSLATIONS[lang] ?? TRANSLATIONS.en;
}
