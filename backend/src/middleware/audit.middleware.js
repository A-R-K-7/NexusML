const AuditLog = require('../models/AuditLog');

/**
 * Audit middleware — automatically logs all mutating requests (POST, PUT, PATCH, DELETE)
 */
const auditMiddleware = (action, entityType) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async (body) => {
      // Only log on success
      if (res.statusCode < 400 && req.user) {
        try {
          await AuditLog.create({
            projectId: req.params.projectId || req.body.projectId || null,
            userId: req.user._id,
            action,
            entityType,
            entityId: body?.data?._id || body?._id || req.params.id || null,
            details: { method: req.method, path: req.path },
          });
        } catch (e) {
          // Audit log failure should not break the request
          console.error('Audit log error:', e.message);
        }
      }
      return originalJson(body);
    };

    next();
  };
};

module.exports = auditMiddleware;
