import Boom from 'boom';

export function register(server, options, next) {
  server.route({
    method: ['GET', 'POST'],
    path: '/login',
    config: {
      auth: 'auth0'
    },
    handler(request, reply) {
      if (!request.auth.isAuthenticated) {
        reply(Boom.unauthorized(`Authentication failed due to: ${request.auth.error.message}`));
      } else {
        const originalRoute = request.auth.credentials.query.next;

        request.cookieAuth.set(request.auth.credentials);

        if (originalRoute) {
          reply.redirect(originalRoute);
        } else {
          reply.view('login', {
            profile: request.auth.credentials.profile
          });
        }
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/scopes',
    config: {
      auth: 'session'
    },
    handler(request, reply) {
      reply.view('scopes');
    }
  });

  next();
}

register.attributes = {
  name: 'authentication-routes'
};
