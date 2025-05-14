import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLatestTokens, fetchToken, fetchTokenSupply, fetchOwnProfile, fetchProfileTokens } from "./api";

function App() {
  const [searchAddress, setSearchAddress] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  // Latest Tokens
  const { data: tokens = [], isLoading: tokensLoading, error: tokensError } = useQuery({
    queryKey: ["latestTokens"],
    queryFn: fetchLatestTokens,
  });

  // Search Token
  const { data: searchedToken, refetch: searchToken } = useQuery({
    queryKey: ["token", searchAddress],
    queryFn: () => fetchToken(searchAddress),
    enabled: false,
  });

  // Own Profile
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ["ownProfile"],
    queryFn: fetchOwnProfile,
  });

  // Other Profile Tokens
  const { data: walletTokens, refetch: fetchWalletTokens } = useQuery({
    queryKey: ["walletTokens", walletAddress],
    queryFn: () => fetchProfileTokens(walletAddress),
    enabled: false,
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">BagsApp Dashboard</h1>

      {/* Latest Tokens */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold">Latest Tokens</h2>
        {tokensLoading && <p>Loading...</p>}
        {tokensError && <p className="text-red-500">Error: {tokensError.message}</p>}
        {tokens.length > 0 ? (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Token Address</th>
                <th className="border p-2">Price (USD)</th>
                <th className="border p-2">Supply</th>
                <th className="border p-2">Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <TokenRow key={token.tokenAddress} token={token} />
              ))}
            </tbody>
          </table>
        ) : (
          <p>No tokens found.</p>
        )}
      </div>

      {/* Search Tokens */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold">Search Tokens</h2>
        <input
          type="text"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          placeholder="Enter token address"
          className="border p-2 mr-2"
        />
        <button
          onClick={() => searchToken()}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Search
        </button>
        {searchedToken && (
          <div className="mt-4">
            <p><strong>Name:</strong> {searchedToken.name}</p>
            <p><strong>Symbol:</strong> {searchedToken.symbol}</p>
            <p><strong>Price:</strong> ${searchedToken.price}</p>
            <p><strong>FDMC:</strong> ${searchedToken.fdmc.toLocaleString()}</p>
            <p><strong>24h Volume:</strong> ${searchedToken.volume24h.toLocaleString()}</p>
            <p><strong>24h Price Change:</strong> {searchedToken.priceChange24h}%</p>
            <img src={searchedToken.image} alt={searchedToken.name} className="w-16 h-16 mt-2" />
          </div>
        )}
      </div>

      {/* My Profile */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold">My Profile</h2>
        {profileLoading && <p>Loading...</p>}
        {profileError && <p className="text-red-500">Error: {profileError.message}</p>}
        {profile && (
          <div>
            <p><strong>Username:</strong> {profile.username}</p>
            <p><strong>Wallet:</strong> {profile.walletAddress || "None"}</p>
            <p><strong>Followers:</strong> {profile.followersCount}</p>
            {profile.picture && <img src={profile.picture} alt="Profile" className="w-16 h-16 mt-2" />}
          </div>
        )}
      </div>

      {/* Other Profiles */}
      <div>
        <h2 className="text-xl font-semibold">Other Profiles</h2>
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Enter wallet address"
          className="border p-2 mr-2"
        />
        <button
          onClick={() => fetchWalletTokens()}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Fetch Tokens
        </button>
        {walletTokens && (
          <div className="mt-4">
            <h3 className="text-lg">Wallet Tokens</h3>
            {walletTokens.length > 0 ? (
              <ul>
                {walletTokens.map((token) => (
                  <li key={token.tokenAddress}>
                    <strong>Token:</strong> {token.tokenAddress}, <strong>Balance:</strong> {token.balance}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No tokens found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TokenRow({ token }) {
  const { data: supply } = useQuery({
    queryKey: ["supply", token.tokenAddress],
    queryFn: () => fetchTokenSupply(token.tokenAddress),
  });

  return (
    <tr>
      <td className="border p-2">{token.tokenAddress}</td>
      <td className="border p-2">${token.price.toFixed(6)}</td>
      <td className="border p-2">{supply ? supply.toLocaleString() : "Loading..."}</td>
      <td className="border p-2">{supply ? (supply * token.price).toLocaleString() : "Loading..."}</td>
    </tr>
  );
}

export default App;
