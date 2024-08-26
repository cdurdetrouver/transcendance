import config from "../../env/config.js";

export function login(email, password) {
  console.log("Logging in with email:", email, "and password:", password);
  console.log("Backend URL:", config.backendUrl);
}
