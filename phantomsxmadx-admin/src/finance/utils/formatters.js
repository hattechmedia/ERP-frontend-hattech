// Real-World European Currency Exchange Rates (Base Currency: EUR)
export const exchangeRates = {
  EUR: 1.0,
  USD: 1.08,
  GBP: 0.85,
  CHF: 0.96,
  AUD: 1.65,
};

export const currencyPrefixes = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF ',
  AUD: 'A$',
};

export const currencyOptions = [
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CHF', label: 'CHF' },
];

/**
 * Currency Converter function between supported European & Global currencies
 */
export const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (!amount || isNaN(amount)) return 0;
  const fromRate = exchangeRates[fromCurrency] || 1.0;
  const toRate = exchangeRates[toCurrency] || 1.0;
  // Convert from source currency to base EUR, then to target currency
  const amountInEUR = Number(amount) / fromRate;
  return amountInEUR * toRate;
};

/**
 * Converts amount from base EUR to target currency and formats it cleanly
 */
export const formatCurrency = (amountInEUR, targetCurrency = 'EUR') => {
  if (amountInEUR === undefined || amountInEUR === null || isNaN(amountInEUR)) {
    return `${currencyPrefixes[targetCurrency] || '€'}0`;
  }

  const rate = exchangeRates[targetCurrency] || 1.0;
  const convertedAmount = Number(amountInEUR) * rate;

  const formattedNumber = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(convertedAmount));

  const sign = convertedAmount < 0 ? '-' : '';
  const prefix = currencyPrefixes[targetCurrency] || `${targetCurrency} `;

  return `${sign}${prefix}${formattedNumber}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};
