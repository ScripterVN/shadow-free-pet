export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    // Step 1: Username -> UserId
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

    // Step 2: Get user details
    const userResponse = await fetch(`https://users.roblox.com/v1/users/${userId}`);
    const userInfo = await userResponse.json();

    // Step 3: Get avatar URL
    const avatarResponse = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`
    );
    const avatarData = await avatarResponse.json();
    const avatarUrl = avatarData.data && avatarData.data[0] ? avatarData.data[0].imageUrl : "";

    // Step 4: Return combined result
    return res.status(200).json({
      id: userInfo.id,
      name: userInfo.name,
      displayName: userInfo.displayName,
      description: userInfo.description,
      created: userInfo.created,
      avatarUrl: avatarUrl
    });

  } catch (error) {
    console.error("Roblox API error:", error);
    return res.status(500).json({ error: "Roblox lookup failed" });
  }
}
