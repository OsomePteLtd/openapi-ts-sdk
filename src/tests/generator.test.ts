import { join } from 'path';
import { generate, generateFromOpenApiSpecs } from './generate';

it('Basic Scenario', async () => {
  const endpoints = `
    @token GET /companies?CompanyQuery
      => CompaniesResponse

    @token POST /companies CompanyNewRequest
      => CompanyResponse

    @token GET /companies/:id
      => CompanyResponse

    @token PATCH /companies/:id CompanyUpdateRequest
      => CompanyResponse

    @token DELETE /companies/:id
      => SuccessResponse

    @token POST /companies/:id/archive
      => SuccessResponse
  `;
  const models = `
    SuccessResponse { success: b }
    Company { id: i, name: s, size: i, meta?: o }
    CompanyNew { name: s, size: i }
    CompanyUpdate { name?: s, size?: i }
    CompanyQuery { page?: i, perPage?: i }
    CompaniesResponse { companies: Company[], totalCount: i }
    CompanyResponse { company: Company }
    CompanyNewRequest { company: CompanyNew }
    CompanyUpdateRequest { company: CompanyUpdate }
  `;
  const { clientSource, typesSource, schemasSource } = await generate({
    endpoints,
    models,
  });
  expect(clientSource).toMatchSnapshot();
  expect(typesSource).toMatchSnapshot();
  expect(schemasSource).toMatchSnapshot();
});

it('Anonymous Types', async () => {
  const endpoints = `
    @token GET /billing/invoices/:id:i
      => { invoice: { id: i } }

    @token GET /billing/invoices/
      => { invoices: { id: i }[] }

    @token POST /companies { company: CompanyNew }
      => { company: Company }
  `;
  const models = `
    Company { id: i, name: s, size: i }
    CompanyNew { name: s, size: i }
  `;
  const { clientSource, typesSource } = await generate({ endpoints, models });
  expect(clientSource).toMatchSnapshot();
  expect(typesSource).toMatchSnapshot();
});

it('Enums', async () => {
  const endpoints = `
    @token GET /test
      => s
  `;
  const models = `
    CompanyDealStatus (
      new |
      won |
      lost |
      lostClient |
      test |
      junk
    )
    CompanyType (
      Branch Office Singapore |
      Exempt Private Company Limited by Shares (Pte. Ltd.) |
      Private Limited Company, use of 'Limited' exemption
    )
    CompanyTypeWithSimilarValues (
      Public limited company |
      Public Limited Company
    )
    ProcessDefinitionKey (
      cs-incorporation |
      cs-incorporation-pte-ltd-local |
      cs-appointment-of-new-secretary
    )
    BankAccountStatus (
      ACTIVE |
      ARCHIVED |
    )
  `;
  const { typesSource } = await generate({ endpoints, models });
  expect(typesSource).toMatchSnapshot();
});

it('Dashes and Underscores', async () => {
  const endpoints = `
    GET /user-roles/:role_id
      => { user_role: UserRole }
  `;
  const models = `
    UserRole { id: i, name: s }
  `;
  const { clientSource, typesSource } = await generate({ endpoints, models });
  expect(clientSource).toMatchSnapshot();
  expect(typesSource).toMatchSnapshot();
});

it('Schema Prefix', async () => {
  const endpoints = `
    GET /users/:id
      => { user: User }
  `;
  const models = `
    User { id: i, name: s }
  `;
  const { schemasSource } = await generate({
    endpoints,
    models,
    prefix: 'myFancyPrefix',
  });
  expect(schemasSource).toMatchSnapshot();
});

it('Id Path Parameter', async () => {
  const endpoints = `
    @token GET /companies/:companyId
      => CompanyResponse
  `;
  const models = `
    Company { id: i, name: s, size: i, meta?: o }
    CompanyResponse { company: Company }
  `;
  const { clientSource } = await generate({
    endpoints,
    models,
  });
  expect(clientSource).toMatchSnapshot();
});

it('Typed Schemas', async () => {
  const endpoints = `
    GET /users/:id
      => { user: User }
  `;
  const models = `
    User { id: i, name: s }
  `;
  const { schemasSource } = await generate({
    endpoints,
    models,
    typedSchemas: true,
  });
  expect(schemasSource).toMatchSnapshot();
});

it('Fakes', async () => {
  const models = `
    WithoutId { name: s }
    User { id: i, email: s }
    Company { id: i, name: s }
  `;
  const { fakesSource } = await generate({ endpoints: '', models });
  expect(fakesSource).toMatchSnapshot();
});

describe('OpenAPI V3', () => {
  it('Basic Scenario', async () => {
    const { clientSource, typesSource, schemasSource } =
      await generateFromOpenApiSpecs({
        files: [join(__dirname, 'assets', 'openapi-v3', 'petstore.json')],
      });
    expect(clientSource).toMatchSnapshot();
    expect(typesSource).toMatchSnapshot();
    expect(schemasSource).toMatchSnapshot();
  });
});

describe('OpenAPI V3_1', () => {
  it('Basic Scenario', async () => {
    const { clientSource, typesSource, schemasSource } =
      await generateFromOpenApiSpecs({
        files: [join(__dirname, 'assets', 'openapi-v3_1', 'schema.json')],
      });
    expect(clientSource).toMatchSnapshot();
    expect(typesSource).toMatchSnapshot();
    expect(schemasSource).toMatchSnapshot();
  });
});
