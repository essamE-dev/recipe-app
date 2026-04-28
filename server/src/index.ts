import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config();

const port = Number(process.env.PORT ?? 5174);

app.listen(port, () => {
  // Avoid logging secrets and keep startup logs clear for local dev.
  console.log(`Recipes proxy server listening on http://localhost:${port}`);
});
