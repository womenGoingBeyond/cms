module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '4c74edeb035354f81371a5f6a402632a'),
  },
});
