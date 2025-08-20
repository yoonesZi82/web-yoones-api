const phoneRegex = /^(0?9\d{9}|98\d{9}|\d{6,15})$/;
const passwordRegex = new RegExp(
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/g,
);

export { phoneRegex, passwordRegex };
