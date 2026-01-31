import axios from "axios";

export const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true, // important if you use cookies/session
  headers: {
    "Content-Type": "application/json",
  },
});
