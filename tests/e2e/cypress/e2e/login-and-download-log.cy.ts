/// <reference types="cypress" />

/**
 * E2E: user đăng nhập vào Console → vào trang Access Logs → search → tải file.
 *
 * Yêu cầu chạy nền:
 *   - apps/api    (port 4000)
 *   - apps/console (port 5174)
 *
 * Lệnh:  pnpm --filter ./tests/e2e test
 */

describe('Login → Access Logs → Download', () => {
  const apiUrl = Cypress.env('apiUrl');
  const user   = Cypress.env('user');
  const pass   = Cypress.env('pass');

  beforeEach(() => {
    // Lấy JWT trực tiếp qua API rồi inject vào localStorage
    cy.request('POST', `${apiUrl}/api/v1/auth/login`, { email: user, password: pass })
      .its('body')
      .then((body: { accessToken: string }) => {
        expect(body.accessToken).to.be.a('string');
        window.localStorage.setItem('cdn_access_token', body.accessToken);
      });
  });

  it('hiển thị bảng log và tải được file', () => {
    cy.visit('/access-logs');

    // 1. Trang load
    cy.contains('h2', 'Access Logs Download').should('be.visible');

    // 2. Chọn hostname (multi-select AntD)
    cy.get('.ant-select-selector').first().click({ force: true });
    cy.get('.ant-select-item-option').contains('www.example.com').click({ force: true });
    cy.get('body').type('{esc}');

    // 3. Date range — AntD RangePicker đã có giá trị mặc định (yesterday → today)
    //    Nếu cần đổi: cy.get('.ant-picker-input input').first().clear().type('2026-05-01');

    // 4. Search
    cy.get('[data-testid="btn-search"]').click();

    // 5. Bảng có ít nhất 1 dòng
    cy.get('.ant-table-row', { timeout: 10000 }).its('length').should('be.gte', 1);

    // 6. Bấm Download của dòng đầu có status READY
    cy.contains('.ant-table-row', 'READY')
      .within(() => {
        cy.contains('a, button', 'Download').should('have.attr', 'href').and('match', /^https?:\/\//);
      });
  });

  it('chặn khi không chọn hostname', () => {
    cy.visit('/access-logs');
    cy.get('[data-testid="btn-search"]').click();
    cy.contains('Chọn ít nhất 1 hostname').should('be.visible');
  });
});
