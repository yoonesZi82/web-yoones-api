const phoneRegex = new RegExp(/^09\d{9}$/g);
const passwordRegex = new RegExp(
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/g,
);

export { phoneRegex, passwordRegex };
