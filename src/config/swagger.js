const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const fs = require('fs');
const env = require('./env');

// Try to locate a prebuilt swagger.json in several likely places so the
// bundled server (running from `dist/` or invoked as `node dist/server.js`)
// can serve the static spec without scanning source files. If a prebuilt
// spec is found we will optionally override its `servers[0].url` from
// `API_BASE_URL` in `.env` so builds can remain static while runtime uses
// the configured host.
const candidatePrebuilts = [
  path.join(process.cwd(), 'swagger.json'),
  path.join(process.cwd(), 'dist', 'swagger.json'),
  path.join(__dirname, '..', 'swagger.json'),
  path.join(__dirname, '..', '..', 'swagger.json'),
  path.join(__dirname, 'swagger.json'),
];
for (const p of candidatePrebuilts) {
  if (fs.existsSync(p)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
      // If user provided API_BASE_URL, override the servers entry so Swagger UI
      // shows the correct API host even when serving a prebuilt spec.
      if (env && env.API_BASE_URL) {
        parsed.servers = [{ url: env.API_BASE_URL, description: 'Configured API server' }];
      }
      module.exports = parsed;
      break;
    } catch (e) {
      console.warn('Failed to parse prebuilt swagger.json at', p, e.message);
    }
  }
}

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'APP_MAIN API',
      version: '1.0.0',
      description:
        'Production-ready REST API — Node.js + Express + MySQL with JWT auth, rate limiting and clustering.',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT || 3000}`,
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter the access token returned by /auth/login',
        },
      },
      schemas: {
        // ── Shared ─────────────────────────────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'fail' },
            message: { type: 'string', example: 'Descriptive error message' },
          },
        },
        // ── Auth ────────────────────────────────────────────────────────────
        RegisterBody: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100, example: 'Alice Nguyen' },
            email: { type: 'string', format: 'email', example: 'alice@example.com' },
            password: { type: 'string', minLength: 8, example: 'secret123' },
          },
        },
        LoginBody: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'alice@example.com' },
            password: { type: 'string', example: 'secret123' },
          },
        },
        Tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGci...' },
            refreshToken: { type: 'string', example: 'eyJhbGci...' },
          },
        },
        // ── User ────────────────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Alice Nguyen' },
            email: { type: 'string', format: 'email', example: 'alice@example.com' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            is_active: { type: 'integer', enum: [0, 1], example: 1 },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        UpdateUserBody: {
          type: 'object',
          minProperties: 1,
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100, example: 'Bob Smith' },
            email: { type: 'string', format: 'email', example: 'bob@example.com' },
          },
        },
        // ── Task ────────────────────────────────────────────────────────────
        Task: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            user_id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'Write unit tests' },
            description: { type: 'string', nullable: true, example: 'Cover all service methods' },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'done'],
              example: 'pending',
            },
            due_date: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2026-05-15T00:00:00Z',
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateTaskBody: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 255, example: 'Write unit tests' },
            description: { type: 'string', maxLength: 2000, nullable: true, example: 'Cover all service methods' },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'done'],
              default: 'pending',
              example: 'pending',
            },
            due_date: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2026-05-15T00:00:00Z',
            },
          },
        },
        UpdateTaskBody: {
          type: 'object',
          minProperties: 1,
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 255, example: 'Write unit tests' },
            description: { type: 'string', maxLength: 2000, nullable: true },
            status: { type: 'string', enum: ['pending', 'in_progress', 'done'] },
            due_date: { type: 'string', format: 'date-time', nullable: true },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Unauthorized — missing or invalid token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden — insufficient role',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        TooManyRequests: {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  // Scan all route files for @openapi JSDoc blocks. Use relative globs
  // so swagger-jsdoc resolves files correctly when run from project root.
  apis: [
    './src/modules/**/*.routes.js',
    './src/modules/**/*.js',
  ],
};

// If we already exported a prebuilt spec above, don't re-generate it.
// Note: `module.exports` is an object by default ({}), so checking
// `!module.exports` is false. Detect an empty object instead and
// generate the spec when no useful prebuilt was found.
if (!module.exports || (typeof module.exports === 'object' && Object.keys(module.exports).length === 0)) {
  const swaggerSpec = swaggerJsdoc(options);
  module.exports = swaggerSpec;
}
