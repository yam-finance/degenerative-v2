import axios from 'axios';

// Grab prices token vs USD from Coingecko API
export const getEthPrice = async () => {
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const data = res.data;
    return data;
  } catch (err) {
    return Promise.reject(err);
  }
};

export const getApy = () => {};
