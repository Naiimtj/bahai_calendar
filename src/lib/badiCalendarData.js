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
          'Celebration of the twelfth day of Riḍván, which marks the end of the twelve-day period in which Bahá’u’lláh declared His mission as the Promised One of the last days.',
        '1Ridvan':
          'Celebration of the first day of Riḍván, which marks the beginning of the Festival of Riḍván.',
        '9Ridvan':
          'Celebration of the ninth day of Riḍván, which commemorates the arrival of Bahá’u’lláh in the city of Baghdad.',
        ascensionA:
          'Commemoration of the ascension of ‘Abdu’l-Bahá, the son of Bahá’u’lláh.',
        ascensionB:
          "Commemoration of the ascension of Bahá’u’lláh, the founder of the Bahá'í Faith.",
        birthB:
          "Celebration of the birth of Bahá’u’lláh, the founder of the Bahá'í Faith.",
        birthBab:
          'Celebration of the birth of the Báb, the precursor of Bahá’u’lláh.',
        covenant:
          "Commemoration of the Covenant of Bahá’u’lláh, which establishes the succession of leadership in the Bahá'í Faith.",
        declarationBab:
          'Commemoration of the declaration of the Báb as the Messenger of God.',
        martyrdomBab: 'Commemoration of the martyrdom of the Báb.',
        nawruz: "Celebration of Naw-Rúz, the Bahá'í New Year.",
        '1fast': "First day of the period of fasting in the Bahá'í Faith.",
        '19fast': "Last day of the period of fasting in the Bahá'í Faith.",
        ayyamiha: "Intercalary days in the Bahá'í calendar.",
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
        0: "Intercalary days in the Bahá'í calendar.",
        1: 'Month of Splendour.',
        2: 'Month of Glory.',
        3: 'Month of Beauty.',
        4: 'Month of Grandeur.',
        5: 'Month of Light.',
        6: 'Month of Mercy.',
        7: 'Month of Words.',
        8: 'Month of Perfection.',
        9: 'Month of Names.',
        10: 'Month of Might.',
        11: 'Month of Will.',
        12: 'Month of Knowledge.',
        13: 'Month of Power.',
        14: 'Month of Speech.',
        15: 'Month of Questions.',
        16: 'Month of Honour.',
        17: 'Month of Sovereignty.',
        18: 'Month of Dominion.',
        19: 'Month of Loftiness.',
      },
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
          'الاحتفال باليوم الثاني عشر من الرضوان، الذي يصادف نهاية فترة الاثني عشر يوماً التي أعلن فيها بهاء الله رسالته بوصفه الموعود في آخر الزمان.',
        '1Ridvan':
          'الاحتفال باليوم الأول من الرضوان، الذي يصادف بداية عيد الرضوان.',
        '9Ridvan':
          'الاحتفال باليوم التاسع من الرضوان، الذي يُحيي ذكرى وصول بهاء الله إلى مدينة بغداد.',
        ascensionA: 'إحياء ذكرى صعود عبد البهاء، ابن بهاء الله.',
        ascensionB: 'إحياء ذكرى صعود بهاء الله، مؤسس الدين البهائي.',
        birthB: 'الاحتفال بمولد بهاء الله، مؤسس الدين البهائي.',
        birthBab: 'الاحتفال بمولد الباب، مبشّر بهاء الله.',
        covenant:
          'إحياء ذكرى عهد وميثاق بهاء الله، الذي يُرسي خلافة القيادة في الدين البهائي.',
        declarationBab: 'إحياء ذكرى إعلان الباب رسولاً من عند الله.',
        martyrdomBab: 'إحياء ذكرى استشهاد الباب.',
        nawruz: 'الاحتفال بعيد النوروز، رأس السنة البهائية.',
        '1fast': 'اليوم الأول من فترة الصيام في الدين البهائي.',
        '19fast': 'اليوم الأخير من فترة الصيام في الدين البهائي.',
        ayyamiha: 'الأيام المُدرَجة (أيام الهاء) في التقويم البهائي.',
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
        0: 'الأيام المُدرَجة في التقويم البهائي.',
        1: 'شهر البهاء.',
        2: 'شهر الجلال.',
        3: 'شهر الجمال.',
        4: 'شهر العظمة.',
        5: 'شهر النور.',
        6: 'شهر الرحمة.',
        7: 'شهر الكلمات.',
        8: 'شهر الكمال.',
        9: 'شهر الأسماء.',
        10: 'شهر العزة.',
        11: 'شهر المشيئة.',
        12: 'شهر العلم.',
        13: 'شهر القدرة.',
        14: 'شهر القول.',
        15: 'شهر المسائل.',
        16: 'شهر الشرف.',
        17: 'شهر السلطان.',
        18: 'شهر الملك.',
        19: 'شهر العلاء.',
      },
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
          'Feier des zwölften Tages von Riḍván, der das Ende des zwölftägigen Zeitraums markiert, in dem Bahá’u’lláh Seine Sendung als der Verheißene der letzten Tage verkündete.',
        '1Ridvan':
          'Feier des ersten Tages von Riḍván, der den Beginn des Riḍván-Festes markiert.',
        '9Ridvan':
          'Feier des neunten Tages von Riḍván, der an die Ankunft Bahá’u’lláhs in der Stadt Bagdad erinnert.',
        ascensionA:
          'Gedenken an das Hinscheiden ‘Abdu’l-Bahás, des Sohnes Bahá’u’lláhs.',
        ascensionB:
          'Gedenken an das Hinscheiden Bahá’u’lláhs, des Stifters des Bahá’í-Glaubens.',
        birthB:
          'Feier der Geburt Bahá’u’lláhs, des Stifters des Bahá’í-Glaubens.',
        birthBab: 'Feier der Geburt des Báb, des Vorläufers Bahá’u’lláhs.',
        covenant:
          'Gedenken an den Bund Bahá’u’lláhs, der die Nachfolge der Führung im Bahá’í-Glauben festlegt.',
        declarationBab: 'Gedenken an die Erklärung des Báb als Bote Gottes.',
        martyrdomBab: 'Gedenken an das Martyrium des Báb.',
        nawruz: 'Feier von Naw-Rúz, dem Bahá’í-Neujahr.',
        '1fast': 'Erster Tag der Fastenzeit im Bahá’í-Glauben.',
        '19fast': 'Letzter Tag der Fastenzeit im Bahá’í-Glauben.',
        ayyamiha: 'Schalttage im Bahá’í-Kalender.',
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
        0: 'Schalttage im Bahá’í-Kalender.',
        1: 'Monat des Glanzes.',
        2: 'Monat der Herrlichkeit.',
        3: 'Monat der Schönheit.',
        4: 'Monat der Größe.',
        5: 'Monat des Lichts.',
        6: 'Monat der Barmherzigkeit.',
        7: 'Monat der Worte.',
        8: 'Monat der Vollkommenheit.',
        9: 'Monat der Namen.',
        10: 'Monat der Macht.',
        11: 'Monat des Willens.',
        12: 'Monat des Wissens.',
        13: 'Monat der Kraft.',
        14: 'Monat der Rede.',
        15: 'Monat der Fragen.',
        16: 'Monat der Ehre.',
        17: 'Monat der Souveränität.',
        18: 'Monat der Herrschaft.',
        19: 'Monat der Erhabenheit.',
      },
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
          'جشن دوازدهمین روز عید رضوان، که پایان دورهٔ دوازده‌روزه‌ای را نشان می‌دهد که در آن حضرت بهاءالله رسالت خود را به‌عنوان موعود آخرالزمان اعلام فرمودند.',
        '1Ridvan':
          'جشن نخستین روز عید رضوان، که آغاز عید رضوان را نشان می‌دهد.',
        '9Ridvan':
          'جشن نهمین روز عید رضوان، که یادآور ورود حضرت بهاءالله به شهر بغداد است.',
        ascensionA: 'یادبود صعود حضرت عبدالبهاء، فرزند حضرت بهاءالله.',
        ascensionB: 'یادبود صعود حضرت بهاءالله، مؤسس آیین بهائی.',
        birthB: 'جشن میلاد حضرت بهاءالله، مؤسس آیین بهائی.',
        birthBab: 'جشن میلاد حضرت باب، مبشّر حضرت بهاءالله.',
        covenant:
          'یادبود میثاق حضرت بهاءالله، که جانشینی رهبری در آیین بهائی را برقرار می‌سازد.',
        declarationBab: 'یادبود بعثت حضرت باب به‌عنوان پیام‌آور الهی.',
        martyrdomBab: 'یادبود شهادت حضرت باب.',
        nawruz: 'جشن نوروز، آغاز سال نو بهائی.',
        '1fast': 'نخستین روز دورهٔ روزه در آیین بهائی.',
        '19fast': 'آخرین روز دورهٔ روزه در آیین بهائی.',
        ayyamiha: 'ایام هاء (روزهای افزوده) در تقویم بهائی.',
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
        0: 'روزهای افزوده در تقویم بهائی.',
        1: 'ماه بهاء.',
        2: 'ماه جلال.',
        3: 'ماه جمال.',
        4: 'ماه عظمت.',
        5: 'ماه نور.',
        6: 'ماه رحمت.',
        7: 'ماه کلمات.',
        8: 'ماه کمال.',
        9: 'ماه اسماء.',
        10: 'ماه عزّت.',
        11: 'ماه مشیت.',
        12: 'ماه علم.',
        13: 'ماه قدرت.',
        14: 'ماه قول.',
        15: 'ماه مسائل.',
        16: 'ماه شرف.',
        17: 'ماه سلطان.',
        18: 'ماه مُلک.',
        19: 'ماه علاء.',
      },
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
          'Célébration du douzième jour de Riḍván, qui marque la fin de la période de douze jours durant laquelle Bahá’u’lláh déclara Sa mission en tant que Promis des derniers jours.',
        '1Ridvan':
          'Célébration du premier jour de Riḍván, qui marque le début de la Fête de Riḍván.',
        '9Ridvan':
          'Célébration du neuvième jour de Riḍván, qui commémore l’arrivée de Bahá’u’lláh dans la ville de Bagdad.',
        ascensionA:
          'Commémoration de l’ascension de ‘Abdu’l-Bahá, le fils de Bahá’u’lláh.',
        ascensionB:
          'Commémoration de l’ascension de Bahá’u’lláh, le fondateur de la foi bahá’íe.',
        birthB:
          'Célébration de la naissance de Bahá’u’lláh, le fondateur de la foi bahá’íe.',
        birthBab:
          'Célébration de la naissance du Báb, le précurseur de Bahá’u’lláh.',
        covenant:
          'Commémoration de l’Alliance de Bahá’u’lláh, qui établit la succession de l’autorité dans la foi bahá’íe.',
        declarationBab:
          'Commémoration de la déclaration du Báb en tant que Messager de Dieu.',
        martyrdomBab: 'Commémoration du martyre du Báb.',
        nawruz: 'Célébration de Naw-Rúz, le Nouvel An bahá’í.',
        '1fast': 'Premier jour de la période de jeûne dans la foi bahá’íe.',
        '19fast': 'Dernier jour de la période de jeûne dans la foi bahá’íe.',
        ayyamiha: 'Jours intercalaires du calendrier bahá’í.',
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
        0: 'Jours intercalaires du calendrier bahá’í.',
        1: 'Mois de la Splendeur.',
        2: 'Mois de la Gloire.',
        3: 'Mois de la Beauté.',
        4: 'Mois de la Grandeur.',
        5: 'Mois de la Lumière.',
        6: 'Mois de la Miséricorde.',
        7: 'Mois des Paroles.',
        8: 'Mois de la Perfection.',
        9: 'Mois des Noms.',
        10: 'Mois de la Puissance.',
        11: 'Mois de la Volonté.',
        12: 'Mois de la Connaissance.',
        13: 'Mois du Pouvoir.',
        14: 'Mois du Discours.',
        15: 'Mois des Questions.',
        16: 'Mois de l’Honneur.',
        17: 'Mois de la Souveraineté.',
        18: 'Mois de la Domination.',
        19: 'Mois de l’Élévation.',
      },
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
