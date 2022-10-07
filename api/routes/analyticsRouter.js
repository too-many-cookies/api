module.exports = (app) => {
  const router = require("express").Router();
  const analytics_controller = require("../controllers/analyticsController");

  router.get("/test", analytics_controller.test_api);
  router.get("/healthz", analytics_controller.health_check);

  router.get("/logins/success", analytics_controller.get_successful_logins);
  router.get("/logins/failure", analytics_controller.get_failed_logins);
  router.get("/recentLogs", analytics_controller.get_recent_logs);

  router.get("/classes", analytics_controller.get_classes);
  router.get("/classes/:id", analytics_controller.get_class);

  router.get("/students/:classID", analytics_controller.get_students_by_class);

  app.use("/v1", router);
};
