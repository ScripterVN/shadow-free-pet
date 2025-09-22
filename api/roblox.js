export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    // Step 1: Get userId from username
    const response = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
    });

    const data = await response.json();
    if (!data.data || data.data.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = data.data[0].id;

    // Step 2: Get user info
    const userResponse = await fetch(`https://users.roblox.com/v1/users/${userId}`);
    const userInfo = await userResponse.json();

    return res.status(200).json(userInfo);

  } catch (error) {
    console.error("Roblox API error:", error);
    return res.status(500).json({ error: "Roblox lookup failed" });
  }
}
