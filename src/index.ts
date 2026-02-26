import app from "./app.js";
import { DOTENV } from "./consts/dotenv.js";

const PORT = DOTENV.PORT;

app.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
});
