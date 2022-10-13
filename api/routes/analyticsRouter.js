module.exports = (app) => {
  const router = require("express").Router();
  const analytics_controller = require("../controllers/analyticsController");

  router.get("/healthz", analytics_controller.health_check);

  router.post("/logins", analytics_controller.get_logins);
  router.post("/logins/:classID", analytics_controller.get_logins_by_class);

  router.post("/classes", analytics_controller.get_classes);
  router.post("/classes/:classID", analytics_controller.get_class);

  router.post("/students/:classID", analytics_controller.get_students_by_class);

  app.use("/v1", router);
};
