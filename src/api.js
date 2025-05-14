import axios from "axios";

const API_URL = "https://api2.bags.fm/api/v1";
const BEARER_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImZiM2ZhMmJhMDkwOGQwOTlkOGY5ZGNhYzQ0ODYifQ.eyJzdWIiOiI1N2Y3MjFjMi1iYjY4LTQxNDMtODgxZS1lYjE5MjM1Mjg0ZjMiLCJhdWQiOlsiaHR0cHM6Ly9iYWdzLmZtIl0sImlzcyI6Imh0dHBzOi8vYXBpLmJhZ3MuZm0vYXBpL3YxL2F1dGgiLCJpYXQiOjE3NDcwNTk0OTMsInNpZCI6IkJESV9YOHp3aWNwSXNyRmNUYlR6MXAwaGxFVWVqYXZ2IiwiZXhwIjoxNzQ5NDc4NjkzLCJzY29wZSI6InVzZXIifQ.nNI1lfSm5-KbuveqakzyeGgOjElXgnRTxf_l3wublH8DxADESs3Dzpk-wOl1AD34yf0Nk5t8WKoWEfjlqx8p3FyKCMj7pVhzPqRKuYglPOFrgE-IGOxm49cPGolNnrRjvU2SyqeX3gZZCwVoTi7OPTicS2QZYV1Me6TgfR7uAKbGZMfNSkYFi5ahnlPXDS2MWd2fQ6NZWS0VOX3nCw65OtTqhE8onhpiWdM7F511UGg0uiYRHndj7hSKChBMNsL22t6wbQ7j3slMx4Zm7-g0JExXmtqZ8cZ8kt7ugNckSIfqstaLTYhNUht34orxK9Lk-xPXgVW0sbXlDTppfhKBUw";

// Axios instance (no User-Agent/Origin to avoid unsafe header errors)
const api = axios.create({
  baseURL: API_URL,
  headers: {
    Authorization: `Bearer ${BEARER_TOKEN}`,
    Accept: "application/json",
  },
});

// Fetch latest tokens from leaderboard
const fetchLatestTokens = async () => {
  try {
    const response = await api.get("/token-launch/leaderboard");
    if (!response.data.success) {
      throw new Error("API returned success: false");
    }
    return response.data.response.map((token) => ({
      tokenAddress: token.tokenAddress,
      price: parseFloat(token.price),
    }));
  } catch (error) {
    console.error("Error fetching latest tokens:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw new Error(`Failed to fetch latest tokens: ${error.message}`);
  }
};

/**
 * Description:
 * - Fetches recent tokens from /token-launch/leaderboard directly.
 * - Response: Array of { tokenAddress, price }.
 * - Used for "Latest Tokens" tab.
 * - Note: Likely to fail with CORS error in browser.
 */

// Search token by address
const fetchToken = async (tokenAddress) => {
  try {
    const response = await api.get(`/bags/token/find?tokenAddress=${tokenAddress}`);
    if (!response.data.success) {
      throw new Error("API returned success: false");
    }
    const { cryptoToken } = response.data.response;
    return {
      tokenAddress: cryptoToken.tokenAddress,
      name: cryptoToken.name,
      symbol: cryptoToken.symbol,
      price: cryptoToken.price.price,
      fdmc: cryptoToken.fdmc.fdmc,
      volume24h: parseFloat(cryptoToken.volumeUsd.h24),
      priceChange24h: cryptoToken.priceChangePercentage.h24,
      image: cryptoToken.image,
    };
  } catch (error) {
    console.error(`Error fetching token ${tokenAddress}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw new Error(`Failed to fetch token: ${error.message}`);
  }
};

/**
 * Description:
 * - Fetches token metadata by address directly.
 * - Response: Object with { tokenAddress, name, symbol, price, fdmc, volume24h, priceChange24h, image }.
 * - Used for "Search Tokens" tab.
 * - Note: Likely to fail with CORS error in browser.
 */

// Fetch token supply
const fetchTokenSupply = async (tokenAddress) => {
  try {
    const response = await api.get(`/token/${tokenAddress}/supply`);
    if (!response.data.success) {
      throw new Error("API returned success: false");
    }
    return response.data.response.uiAmount;
  } catch (error) {
    console.error(`Error fetching supply for ${tokenAddress}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw new Error(`Failed to fetch token supply: ${error.message}`);
  }
};

/**
 * Description:
 * - Fetches token supply by address directly.
 * - Response: Number (e.g., 999094596.7505547).
 * - Used for market cap calculations.
 * - Note: Likely to fail with CORS error in browser.
 */

// Fetch authenticated user's profile
const fetchOwnProfile = async () => {
  try {
    const response = await api.get("/user/me");
    if (!response.data.success) {
      throw new Error("API returned success: false");
    }
    return {
      username: response.data.response.username,
      walletAddress: response.data.response.wallet_list[0] || null,
      picture: response.data.response.picture,
      followersCount: response.data.response.twitter_data.followers_count,
    };
  } catch (error) {
    console.error("Error fetching own profile:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }
};

/**
 * Description:
 * - Fetches user’s profile via /user/me directly.
 * - Response: Object with { username, walletAddress, picture, followersCount }.
 * - Used for "My Profile" tab.
 * - Note: Likely to fail with CORS error in browser.
 */

// Fetch token holdings for a wallet (Solana blockchain fallback)
const fetchProfileTokens = async (walletAddress) => {
  try {
    const { Connection, PublicKey } = require("@solana/web3.js");
    const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
    const publicKey = new PublicKey(walletAddress);
    const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, {
      programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    });
    const tokens = [];
    for (const account of tokenAccounts.value) {
      const accountInfo = await connection.getTokenAccountBalance(account.pubkey);
      const mintAddress = accountInfo.value.mint.toBase58();
      tokens.push({ tokenAddress: mintAddress, balance: accountInfo.value.uiAmount });
    }
    return tokens;
  } catch (error) {
    console.error(`Error fetching tokens for wallet ${walletAddress}:`, {
      message: error.message,
    });
    throw new Error(`Failed to fetch wallet tokens: ${error.message}`);
  }
};

/**
 * Description:
 * - Fetches token holdings via Solana blockchain (no CORS issues).
 * - Response: Array of { tokenAddress, balance }.
 * - Used for "My Profile" and "Other Profiles" tabs.
 */

export {
  fetchLatestTokens,
  fetchToken,
  fetchTokenSupply,
  fetchOwnProfile,
  fetchProfileTokens,
};
