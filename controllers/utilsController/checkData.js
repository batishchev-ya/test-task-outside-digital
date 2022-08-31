exports.validatePassword = (password) => {
  const passwordCheck = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,40}$/;
  return passwordCheck.test(password);
};

exports.validateEmail = (email) => {
  const emailCheck =
    /^[A-Za-z0-9]{1}[A-Za-z0-9.]+[A-Za-z0-9]{1}@[A-Za-z0-9]+\.[A-Za-z0-9]+$/;
  return emailCheck.test(email);
};

exports.validateNickname = (nickname) => {
  const nicknameCheck = /^\d*[a-zA-Z][a-zA-Z\d]*$/;
  return nicknameCheck.test(nickname);
};

exports.validateTagName = (nameTag) => {
  const tagCheck = /^\d*[a-zA-Z][a-zA-Z\d]*$/;
  return tagCheck.test(nameTag);
};
