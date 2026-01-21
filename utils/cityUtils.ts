const CITY_STANDARDIZATION: Record<string, string> = {
    'attard': 'Attard',
    'bahar iccaghaq': 'Bahar ic-Caghaq',
    'bahar ic-caghaq': 'Bahar ic-Caghaq',
    'balzan': 'Balzan',
    'b\'kara': 'Birkirkara',
    'bkara': 'Birkirkara',
    'swatar birkirkara': 'Birkirkara',
    'birkirkara': 'Birkirkara',
    'birzebbuga': 'Birzebbuga',
    'birzebbugia': 'Birzebbuga',
    'birzebbuiga': 'Birzebbuga',
    'birżebbuġa': 'Birzebbuga',
    'fgura': 'Fgura',
    'zabbar rd fgura': 'Fgura',
    'gharghur': 'Gharghur',
    'għargħur': 'Gharghur',
    'ghaxaq': 'Ghaxaq',
    'għaxaq': 'Ghaxaq',
    'gzira': 'Gzira',
    'gżira': 'Gzira',
    'hamrun': 'Hamrun',
    'ħamrun': 'Hamrun',
    'iklin': 'Iklin',
    'kalkara': 'Kalkara',
    'lija': 'Lija',
    'hal lija': 'Lija',
    'luqa': 'Luqa',
    'hal farrug luqa': 'Luqa',
    'luqa malta': 'Luqa',
    'manikata': 'Manikata',
    'marsa': 'Marsa',
    'marsascala': 'Marsaskala',
    'marsascala (msk)': 'Marsaskala',
    'marsaskala': 'Marsaskala',
    'marsaxlokk': 'Marsaxlokk',
    'mellieha': 'Mellieha',
    'melliha': 'Mellieha',
    'mellieħa': 'Mellieha',
    'mgarr': 'Mgarr',
    'limgarr zebbiegh': 'Mgarr',
    'zebbiegh': 'Mgarr',
    'mġarr': 'Mgarr',
    'mosta': 'Mosta',
    'mqabba': 'Mqabba',
    'mriehel': 'Mriehel',
    'msida': 'Msida',
    'il msida': 'Msida',
    'il-msida': 'Msida',
    'mtarfa': 'Mtarfa',
    'munxar': 'Munxar',
    'nadur': 'Nadur',
    'naxxar': 'Naxxar',
    'birguma naxxar': 'Naxxar',
    'paceville': 'Paceville',
    'paola': 'Paola',
    'pembroke': 'Pembroke',
    'pieta': 'Pieta',
    'pietà': 'Pieta',
    'qawra': 'Qawra',
    'qormi': 'Qormi',
    'hal qormi': 'Qormi',
    'qrendi': 'Qrendi',
    'rabat': 'Rabat',
    'rabat (gozo)': 'Victoria',
    'victoria gozo': 'Victoria',
    'victoria': 'Victoria',
    'st paul\'s bay': 'Saint Paul\'s Bay',
    'st. paul\'s bay': 'Saint Paul\'s Bay',
    'st pauls bay': 'Saint Paul\'s Bay',
    'st. pauls bay': 'Saint Paul\'s Bay',
    'san paul bahar': 'Saint Paul\'s Bay',
    'san pawl il bahar': 'Saint Paul\'s Bay',
    'san pawl il-bahar': 'Saint Paul\'s Bay',
    'saint paul\'s bay': 'Saint Paul\'s Bay',
    'san gwann': 'San Gwann',
    'san gwan': 'San Gwann',
    'san  gwann': 'San Gwann',
    'san ġwann': 'San Gwann',
    'santa lucia': 'Santa Lucija',
    'santa lucija': 'Santa Lucija',
    'santa luċija': 'Santa Lucija',
    'st. venera': 'Santa Venera',
    'st venera': 'Santa Venera',
    'santa venera': 'Santa Venera',
    'siggiewi': 'Siggiewi',
    'siġġiewi': 'Siggiewi',
    'sliema': 'Sliema',
    'silema': 'Sliema',
    'slima': 'Sliema',
    'st julians': 'St. Julian\'s',
    'st. julians': 'St. Julian\'s',
    'saint julians': 'St. Julian\'s',
    'san giljan': 'St. Julian\'s',
    'st. julian': 'St. Julian\'s',
    'st. julian\'s': 'St. Julian\'s',
    'swieqi': 'Swieqi',
    'swieqi (malta)': 'Swieqi',
    'madliena swieqi': 'Swieqi',
    'ta xbiex': 'Ta\' Xbiex',
    'ta\' xbiex': 'Ta\' Xbiex',
    'tarxien': 'Tarxien',
    'valleta': 'Valletta',
    'belt valletta': 'Valletta',
    'valletta': 'Valletta',
    'xghajra': 'Xghajra',
    'xgħajra': 'Xghajra',
    'zabbar': 'Zabbar',
    'żabbar': 'Zabbar',
    'zebbug gozo': 'Zebbug (Gozo)',
    'zebbug': 'Zebbug',
    'zebbug malta': 'Zebbug',
    'żebbuġ': 'Zebbug',
    'zejtun': 'Zejtun',
    'żejtun': 'Zejtun',
    'zurrieq': 'Zurrieq',
    'żurrieq': 'Zurrieq',
    'kirkop': 'Kirkop',
    'hal far': 'Hal Far'
};

const PREFIXES_TO_REMOVE = [
    /^il-/i,
    /^il/i,
    /^haz-/i,
    /^haz/i,
    /^is-/i,
    /^is/i,
    /^ir-/i,
    /^ir/i,
    /^hal\s+/i,
    /^l-/i,
    /^l/i,
    /^lim-/i,
    /^lim/i,
    /^ta-?/i,
    /^iz-/i,
    /^iz/i
];

export function standardizeCityName(cityName: string): string {
    if (!cityName) return '';

    let cleaned = cityName.trim();

    for (const prefix of PREFIXES_TO_REMOVE) {
        cleaned = cleaned.replace(prefix, '');
    }

    cleaned = cleaned.trim();

    const normalized = cleaned.toLowerCase().trim();

    if (CITY_STANDARDIZATION[normalized]) {
        return CITY_STANDARDIZATION[normalized];
    }

    const words = normalized.split(/\s+/);

    for (let i = 0; i < words.length; i++) {
        const possibleCity = words.slice(0, i + 1).join(' ');
        if (CITY_STANDARDIZATION[possibleCity]) {
            return CITY_STANDARDIZATION[possibleCity];
        }
    }

    for (const word of words) {
        if (CITY_STANDARDIZATION[word]) {
            return CITY_STANDARDIZATION[word];
        }
    }

    if (cleaned && cleaned.length > 2) {
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    }

    return '';
}