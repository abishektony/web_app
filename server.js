app.get("/proxy", async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send("No URL provided");
  }

  try {
    const response = await axios.get(url, { maxRedirects: 0 }); // Prevent redirects
    res.send(response.data);
  } catch (error) {
    if (error.response && error.response.status === 301 || error.response.status === 302) {
      return res.status(500).send("Redirect encountered");
    }
    res.status(500).send("Error fetching the URL");
  }
});
