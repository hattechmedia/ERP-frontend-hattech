// Real-World Currency Exchange Rates (Base Currency: PKR)
export const exchangeRates = {
  PKR: 1.0,
  USD: 1 / 278.5, // 1 USD ~ 278.5 PKR
  EUR: 1 / 305.2, // 1 EUR ~ 305.2 PKR
  GBP: 1 / 362.0, // 1 GBP ~ 362.0 PKR
  AUD: 1 / 184.4, // 1 AUD ~ 184.4 PKR
  SAR: 1 / 74.2, // 1 SAR ~ 74.2 PKR
};

export const currencyPrefixes = {
  PKR: 'PKR ',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  SAR: 'SAR ',
};

export const currencyOptions = [
  { value: 'PKR', label: 'PKR' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'SAR', label: 'SAR (ريال)' },
];

/**
 * Live Currency Converter function between any two supported currencies
 */
export const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (!amount || isNaN(amount)) return 0;
  const fromRate = exchangeRates[fromCurrency] || 1.0;
  const toRate = exchangeRates[toCurrency] || 1.0;
  // Convert from source currency to base PKR, then to target currency
  const amountInPKR = Number(amount) / fromRate;
  return amountInPKR * toRate;
};

/**
 * Converts amount from base PKR to target currency and formats it cleanly
 */
export const formatCurrency = (amountInPKR, targetCurrency = 'PKR') => {
  if (amountInPKR === undefined || amountInPKR === null || isNaN(amountInPKR)) {
    return `${currencyPrefixes[targetCurrency] || 'PKR '}0`;
  }

  const rate = exchangeRates[targetCurrency] || 1.0;
  const convertedAmount = Number(amountInPKR) * rate;

  const fractionDigits = targetCurrency === 'PKR' ? 0 : 2;

  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Math.abs(convertedAmount));

  const sign = convertedAmount < 0 ? '-' : '';
  const prefix = currencyPrefixes[targetCurrency] || `${targetCurrency} `;

  return `${sign}${prefix}${formattedNumber}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};
