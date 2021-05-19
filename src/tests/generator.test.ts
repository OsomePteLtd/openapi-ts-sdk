import { generate } from './generate';

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
    Company { id: i, name: s, size: i }
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
