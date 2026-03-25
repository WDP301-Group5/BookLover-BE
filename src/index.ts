import "dotenv/config";
import httpServer from "./app.js";

const PORT = process.env.PORT || 9999;

httpServer.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
