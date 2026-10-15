import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const CurrencyContext = createContext();

export const currencySymbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    AUD: "A$",
    SAR: "﷼ "
};

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState(() => {
        const stored = localStorage.getItem('finance_currency');
        return (stored && stored !== 'PKR') ? stored : 'USD';
    });
    const [rates, setRates] = useState({
        PKR: 1,
        USD: 1 / 280,
        EUR: 1 / 300,
        GBP: 1 / 350,
        AUD: 1 / 185,
        SAR: 1 / 74
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const res = await axios.get('https://open.er-api.com/v6/latest/PKR');
                if (res.data && res.data.rates) {
                    setRates({
                        PKR: 1,
                        USD: res.data.rates.USD || 1 / 280,
                        EUR: res.data.rates.EUR || 1 / 300,
                        GBP: res.data.rates.GBP || 1 / 350,
                        AUD: res.data.rates.AUD || 1 / 185,
                        SAR: res.data.rates.SAR || 1 / 74
                    });
                }
            } catch (err) {
                console.error("Failed to fetch exchange rates, using fallbacks.", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRates();
        const interval = setInterval(fetchRates, 3600000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        localStorage.setItem('finance_currency', currency);
    }, [currency]);

    const exchangeRate = rates[currency] || (1 / 280);

    const formatAmount = (pkrAmount) => {
        const num = Number(pkrAmount) || 0;
        const symbol = currencySymbols[currency] || "$";
        const converted = num * (rates[currency] || (1 / 280));
        return `PKR ${num.toLocaleString()} (${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    };

    const convertAmount = (pkrAmount) => {
        const num = Number(pkrAmount) || 0;
        return num * (rates[currency] || (1 / 280));
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
            currencySymbols
        }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) throw new Error("useCurrency must be used within a CurrencyProvider");
    return context;
};
