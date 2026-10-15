export const getCompanyVaultAccounts = () => {
    try {
        const saved = localStorage.getItem('company_accounts_vault');
        if (saved !== null) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (err) {
        console.error("Error reading company_accounts_vault:", err);
    }
    return [
        { id: '1', bankName: 'Meezan Bank', accountTitle: 'HAT TECH MEDIA (MAIN)', accountNumber: '010203040506' }
    ];
};
