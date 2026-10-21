const PAYMENT = {
  bank: {
    bank: process.env.REACT_APP_BANK_NAME || 'NMB / CRDB',
    account: process.env.REACT_APP_BANK_ACCOUNT || '0123456789',
    name: process.env.REACT_APP_BANK_ACCOUNT_NAME || 'MELICKISEDEKI ZAKARIA SAYI',
  },
  support: process.env.REACT_APP_SUPPORT_PHONE || '0622995734',
};

export default PAYMENT;
