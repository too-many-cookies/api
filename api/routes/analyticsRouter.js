module.exports = (app) => {
  const router = require("express").Router();
  const analytics_controller = require("../controllers/analyticsController");

  router.get("/test", analytics_controller.test_api);
  router.get("/healthz", analytics_controller.health_check);

  router.get("/login", analytics_controller.login);

  router.get("/logins", analytics_controller.get_logins);
  router.get("/logins/:classID", analytics_controller.get_logins_by_class);

  router.get("/classes", analytics_controller.get_classes);
  router.get("/classes/:classID", analytics_controller.get_class);

  router.get("/students/:classID", analytics_controller.get_students_by_class);

  app.use("/v1", router);
};
