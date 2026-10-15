import React, { createContext, useContext, useState, useEffect } from "react";

const CurrencyContext = createContext();

export const currencySymbols = {
    EUR: "€",
    USD: "$",
    GBP: "£",
    CHF: "CHF "
};

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState(() => {
        const stored = localStorage.getItem('finance_currency');
        return (stored && ['EUR', 'USD', 'GBP', 'CHF'].includes(stored)) ? stored : 'EUR';
    });
    const [rates, setRates] = useState({
        EUR: 1.0,
        USD: 1.08,
        GBP: 0.85,
        CHF: 0.96
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        localStorage.setItem('finance_currency', currency);
    }, [currency]);

    const exchangeRate = rates[currency] || 1.0;

    const formatAmount = (eurAmount) => {
        const num = Number(eurAmount) || 0;
        const symbol = currencySymbols[currency] || "€";
        const converted = num * (rates[currency] || 1.0);
        return `${symbol}${converted.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const convertAmount = (eurAmount) => {
        const num = Number(eurAmount) || 0;
        return num * (rates[currency] || 1.0);
    };

    const toggleCurrency = () => {
        const keys = Object.keys(currencySymbols);
        const currentIndex = keys.indexOf(currency);
        const nextIndex = (currentIndex + 1) % keys.length;
        setCurrency(keys[nextIndex]);
    };

    return (
        <CurrencyContext.Provider value={{ 
            currency, 
            setCurrency,
            exchangeRate, 
            rates,
            formatAmount, 
            convertAmount, 
            toggleCurrency,
            loading,
            currencySymbol: currencySymbols[currency] || "€"
        }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => useContext(CurrencyContext);
export default CurrencyContext;
