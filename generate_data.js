const fs = require('fs');
const path = require('path');

// Years: 2021-2033
const years = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];

// Hierarchy matches geographical selection spec (region → countries)
const regions = {
  'North America': ['U.S.', 'Canada'],
  Europe: ['Belgium', 'Russia', 'Rest of Europe'],
  'Asia Pacific': [
    'China',
    'India',
    'Japan',
    'South Korea',
    'Singapore',
    'Thailand',
    'Indonesia',
    'Australia',
    'Rest of Asia Pacific',
  ],
  'Latin America': ['Brazil', 'Argentina', 'Mexico', 'Rest of Latin America'],
  'Middle East': ['UAE', 'Saudi Arabia', 'Qatar', 'Rest of Middle East'],
  Africa: ['South Africa', 'Nigeria', 'Egypt', 'Rest Of Africa'],
};

// Flat segment types (proportions within each type)
const segmentTypes = {
  'By Product Type': {
    Rings: 0.16,
    'Necklaces and Pendants': 0.14,
    Earrings: 0.18,
    'Bracelets and Bangles': 0.12,
    Anklets: 0.06,
    Charms: 0.09,
    'Brooches and Pins': 0.05,
    'Jewelry Sets': 0.08,
    "Others (Cufflinks and Men's Accessories, etc.)": 0.12,
  },
  'By Base Material': {
    'Sterling Silver': 0.16,
    'Gold Vermeil': 0.11,
    'Gold-Plated Brass': 0.1,
    'Gold-Plated Sterling Silver': 0.09,
    'Gold-Filled Metal': 0.08,
    '9K Gold': 0.07,
    '10K Gold': 0.08,
    '14K Gold': 0.12,
    'Stainless Steel with Precious Metal Finish': 0.09,
    'Mixed Metal Jewelry': 0.1,
  },
  'By Design Style': {
    'Minimalist Jewelry': 0.14,
    'Statement Jewelry': 0.13,
    'Personalized Jewelry': 0.12,
    'Stackable Jewelry': 0.13,
    'Charm-Based Jewelry': 0.11,
    'Vintage-Inspired Jewelry': 0.1,
    'Contemporary Designer Jewelry': 0.14,
    'Cultural / Ethnic-Inspired Jewelry': 0.13,
  },
  'By Purchase Occasion': {
    'Daily Wear': 0.22,
    'Self-Purchase': 0.18,
    'Luxury Gifting': 0.12,
    'Festive and Cultural Purchase': 0.14,
    'Anniversary and Special Occasion': 0.12,
    'Bridal-Adjacent Purchase': 0.1,
    'Travel / Souvenir Purchase': 0.12,
  },
};

// By Distribution Channel: Offline / Online → outlets (shares are within channel; weighted below)
const distributionChannels = {
  Offline: {
    'Mono-Brand Semi-Fine Jewelry Boutiques': 0.28,
    'Multi-Brand Jewelry Stores': 0.38,
    'Authorized Jewelry Retailers': 0.34,
  },
  Online: {
    'Brand-Owned Websites': 0.48,
    'Third-Party Ecommerce Platforms': 0.52,
  },
};

const OFFLINE_SHARE_OF_CHANNEL = 0.58;

// Regional totals (USD million, illustrative base year scale)
const regionBaseValues = {
  'North America': 92,
  Europe: 68,
  'Asia Pacific': 78,
  'Latin America': 38,
  'Middle East': 44,
  Africa: 36,
};

const countryShares = {
  'North America': { 'U.S.': 0.82, Canada: 0.18 },
  Europe: { Belgium: 0.12, Russia: 0.18, 'Rest of Europe': 0.7 },
  'Asia Pacific': {
    China: 0.22,
    India: 0.14,
    Japan: 0.18,
    'South Korea': 0.08,
    Singapore: 0.06,
    Thailand: 0.07,
    Indonesia: 0.08,
    Australia: 0.09,
    'Rest of Asia Pacific': 0.08,
  },
  'Latin America': { Brazil: 0.45, Argentina: 0.15, Mexico: 0.28, 'Rest of Latin America': 0.12 },
  'Middle East': { UAE: 0.35, 'Saudi Arabia': 0.4, Qatar: 0.1, 'Rest of Middle East': 0.15 },
  Africa: { 'South Africa': 0.35, Nigeria: 0.25, Egypt: 0.22, 'Rest Of Africa': 0.18 },
};

const regionGrowthRates = {
  'North America': 0.065,
  Europe: 0.068,
  'Asia Pacific': 0.092,
  'Latin America': 0.075,
  'Middle East': 0.072,
  Africa: 0.081,
};

const segmentGrowthMultipliers = {
  'By Product Type': {
    Rings: 1.02,
    'Necklaces and Pendants': 1.05,
    Earrings: 1.08,
    'Bracelets and Bangles': 0.98,
    Anklets: 1.04,
    Charms: 1.06,
    'Brooches and Pins': 0.95,
    'Jewelry Sets': 1.0,
    "Others (Cufflinks and Men's Accessories, etc.)": 1.09,
  },
  'By Base Material': {
    'Sterling Silver': 1.05,
    'Gold Vermeil': 1.12,
    'Gold-Plated Brass': 0.97,
    'Gold-Plated Sterling Silver': 1.03,
    'Gold-Filled Metal': 0.99,
    '9K Gold': 0.94,
    '10K Gold': 0.96,
    '14K Gold': 1.04,
    'Stainless Steel with Precious Metal Finish': 1.1,
    'Mixed Metal Jewelry': 1.07,
  },
  'By Design Style': {
    'Minimalist Jewelry': 1.08,
    'Statement Jewelry': 1.02,
    'Personalized Jewelry': 1.14,
    'Stackable Jewelry': 1.1,
    'Charm-Based Jewelry': 1.06,
    'Vintage-Inspired Jewelry': 0.96,
    'Contemporary Designer Jewelry': 1.05,
    'Cultural / Ethnic-Inspired Jewelry': 1.0,
  },
  'By Purchase Occasion': {
    'Daily Wear': 1.06,
    'Self-Purchase': 1.1,
    'Luxury Gifting': 0.98,
    'Festive and Cultural Purchase': 1.04,
    'Anniversary and Special Occasion': 1.0,
    'Bridal-Adjacent Purchase': 0.97,
    'Travel / Souvenir Purchase': 1.12,
  },
  'By Distribution Channel': {
    'Mono-Brand Semi-Fine Jewelry Boutiques': 1.03,
    'Multi-Brand Jewelry Stores': 1.0,
    'Authorized Jewelry Retailers': 0.98,
    'Brand-Owned Websites': 1.14,
    'Third-Party Ecommerce Platforms': 1.09,
  },
};

const volumePerMillionUSD = 520;

let seed = 42;
function seededRandom() {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}

function addNoise(value, noiseLevel = 0.03) {
  return value * (1 + (seededRandom() - 0.5) * 2 * noiseLevel);
}

function roundTo1(val) {
  return Math.round(val * 10) / 10;
}

function roundToInt(val) {
  return Math.round(val);
}

function generateTimeSeries(baseValue, growthRate, roundFn) {
  const series = {};
  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    const rawValue = baseValue * Math.pow(1 + growthRate, i);
    series[year] = roundFn(addNoise(rawValue));
  }
  return series;
}

function fillSegmentTypesForGeo(dataObj, regionBase, regionGrowth, countryGrowth, roundFn, isVolume) {
  for (const [segType, segments] of Object.entries(segmentTypes)) {
    dataObj[segType] = {};
    for (const [segName, share] of Object.entries(segments)) {
      const segGrowth = countryGrowth * segmentGrowthMultipliers[segType][segName];
      const segBase = regionBase * share;
      const shareVariation = 1 + (seededRandom() - 0.5) * (isVolume ? 0.12 : 0.1);
      dataObj[segType][segName] = generateTimeSeries(segBase * shareVariation, segGrowth, roundFn);
    }
  }

  dataObj['By Distribution Channel'] = {};
  for (const [channel, subs] of Object.entries(distributionChannels)) {
    dataObj['By Distribution Channel'][channel] = {};
    const channelFactor = channel === 'Offline' ? OFFLINE_SHARE_OF_CHANNEL : 1 - OFFLINE_SHARE_OF_CHANNEL;
    for (const [segName, share] of Object.entries(subs)) {
      const segGrowth = countryGrowth * segmentGrowthMultipliers['By Distribution Channel'][segName];
      const segBase = regionBase * channelFactor * share;
      const shareVariation = 1 + (seededRandom() - 0.5) * (isVolume ? 0.12 : 0.1);
      dataObj['By Distribution Channel'][channel][segName] = generateTimeSeries(
        segBase * shareVariation,
        segGrowth,
        roundFn
      );
    }
  }
}

function generateData(isVolume) {
  const data = {};
  const roundFn = isVolume ? roundToInt : roundTo1;
  const multiplier = isVolume ? volumePerMillionUSD : 1;

  for (const [regionName, countries] of Object.entries(regions)) {
    const regionBase = regionBaseValues[regionName] * multiplier;
    const regionGrowth = regionGrowthRates[regionName];

    data[regionName] = {};
    fillSegmentTypesForGeo(data[regionName], regionBase, regionGrowth, regionGrowth, roundFn, isVolume);

    data[regionName]['By Country'] = {};
    for (const country of countries) {
      const cShare = countryShares[regionName][country];
      const countryGrowthVariation = 1 + (seededRandom() - 0.5) * 0.06;
      const countryBase = regionBase * cShare;
      const countryGrowth = regionGrowth * countryGrowthVariation;
      data[regionName]['By Country'][country] = generateTimeSeries(countryBase, countryGrowth, roundFn);
    }

    for (const country of countries) {
      const cShare = countryShares[regionName][country];
      const countryBase = regionBase * cShare;
      const countryGrowthVariation = 1 + (seededRandom() - 0.5) * 0.04;
      const countryGrowth = regionGrowth * countryGrowthVariation;

      data[country] = {};
      fillSegmentTypesForGeo(data[country], countryBase, regionGrowth, countryGrowth, roundFn, isVolume);
    }
  }

  return data;
}

seed = 42;
const valueData = generateData(false);
seed = 7777;
const volumeData = generateData(true);

const outDir = path.join(__dirname, 'public', 'data');
fs.writeFileSync(path.join(outDir, 'value.json'), JSON.stringify(valueData, null, 2));
fs.writeFileSync(path.join(outDir, 'volume.json'), JSON.stringify(volumeData, null, 2));

console.log('Generated value.json and volume.json successfully');
console.log('Value top-level keys:', Object.keys(valueData).slice(0, 8), '... total', Object.keys(valueData).length);
console.log(
  'Segment types (Europe):',
  Object.keys(valueData.Europe || {}).filter((k) => k !== 'By Country')
);
