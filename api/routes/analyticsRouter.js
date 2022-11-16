module.exports = (app) => {
  const router = require("express").Router();
  const analytics_controller = require("../controllers/analyticsController");

  router.get("/healthz", analytics_controller.health_check);

  router.post("/login", analytics_controller.login);

  router.post("/logins", analytics_controller.get_logins);
  router.post("/logins/:classID", analytics_controller.get_logins_by_class);
  router.post("/admin/logins", analytics_controller.get_admin_logins);

  router.post("/classes", analytics_controller.get_classes);
  router.post("/classes/logins", analytics_controller.get_all_class_logins);
  router.post("/classes/:classID", analytics_controller.get_class);

  router.post("/students/:classID", analytics_controller.get_students_by_class);

  router.post("/feedback", analytics_controller.post_feedback);
  router.get("/feedback", analytics_controller.get_feedback);

  app.use("/v1", router);
};
