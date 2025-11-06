import axios from "axios";

const API_BASE = "http://127.0.0.1:5000";

const axiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,  // include cookies
});

export const login = async (username, password) => {
  return axiosInstance.post("/auth/login", { username, password });
};

// api/punch.js
export const punchIn = async (token, username = null, when = null) => {
  const body = {};
  if (username) body.username = username;
  if (when) body.when = when;

  return axiosInstance.post("/punch-in", body, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const punchOut = async (token, username = null, when = null) => {
  const body = {};
  if (username) body.username = username;
  if (when) body.when = when;

  return axiosInstance.put("/punch-out", body, {
    headers: { Authorization: `Bearer ${token}` }
  });
};


export const getMyAttendance = async (token) => {
  return axiosInstance.get("/my-attendance", {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// admin APIs
// export const getWeeklySummary = async (token) => {
//   return axiosInstance.get("/admin/weekly-summary", {
//     headers: { Authorization: `Bearer ${token}` }
//   });
// };

export const getWeeklySummary = async (token, params = {}) => {
  return axiosInstance.get("/admin/weekly-summary", {
    headers: { Authorization: `Bearer ${token}` },
    params, // week_of: "YYYY-MM-DD"
  });
};

export const exportAttendance = async (token,from, to) => {
  // We will get the response as a blob (binary) for Excel
  const response = await axiosInstance.get("/admin/export-attendance", {
    headers: { Authorization: `Bearer ${token}` },
    params: { from, to },
    responseType: "blob", 
  });
  return response.data;
};


export const searchUsers = async (token, params) => {
  return axiosInstance.get("/admin/search", {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
};

export const getDailySummary = async (token, params) => {
  return axiosInstance.get("/admin/daily-summary", {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
};


// Get single user attendance for a range
export const getUserAttendance = (token, username, params) =>
  axiosInstance.get(`/admin/user/${username}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
