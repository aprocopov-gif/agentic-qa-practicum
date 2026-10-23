import { test, expect } from '../fixtures/cleanup.fixture';
import { PlaydatesPage } from '../pages/playdates.page';
import {
  GATE_FAMILY_SKIP_REASON,
  isGateFamilyAuthConfigured,
  newGateFamilyContext,
} from '../support/gate-family.context';
import { installSpecFamilyProvisioning } from '../support/spec-family-hooks';
import { getSpecChildByRole } from '../support/spec-family-provision';
import { playdatesProposeObserved } from '../test-data/factories/propose-playdate.factory';
import { invalidPlaydatesPropose } from '../test-data/invalid-playdates-propose';
import { PlaydateCircleFamily, PlaydatePlaceOption } from '../test-data/playdates-propose.enums';
import { AppRoute } from '../test-data/routes';

const playdatesUrl = new RegExp(`${AppRoute.Playdates.replace('/', '\\/')}(\\/|\\?|$)`);
const newPlaydateUrl = new RegExp(`${AppRoute.NewPlaydate.replace('/', '\\/')}(\\/|\\?|$)`);

test.describe('AQPBT-9 playdates propose form (Family A)', () => {
  installSpecFamilyProvisioning('aqpbt-9');

  test('Playdates shows Find a playdate, Propose, and Send request @smoke', async ({ page }) => {
    const playdates = new PlaydatesPage(page);

    await playdates.goto();

    await expect(playdates.heading).toHaveText(playdatesProposeObserved.heading);
    await expect(playdates.intro).toHaveText(playdatesProposeObserved.intro);
    await expect(playdates.proposePanelTitle).toHaveText(playdatesProposeObserved.proposePanelTitle);
    await expect(playdates.proposePlaydateForm.submitButton).toHaveText(
      playdatesProposeObserved.sendRequest,
    );
  });

  test('family combobox lists only circle families @sanity', async ({ page }) => {
    const playdates = new PlaydatesPage(page);
    const form = playdates.proposePlaydateForm;

    await playdates.goto();

    await expect(form.familyOption(PlaydateCircleFamily.Nguyens)).toBeAttached();
    await expect(form.familyOption(PlaydateCircleFamily.Petrovs)).toBeAttached();
  });

  test('selected circle family shows matches badge and a dated slot @regression', async ({ page }) => {
    const playdates = new PlaydatesPage(page);
    const form = playdates.proposePlaydateForm;

    await playdates.goto();

    await expect(playdates.matchesBadge(playdatesProposeObserved.matchesBadge)).toBeVisible();
    await expect(form.matchedSlots.first()).toBeVisible();
  });

  test('selecting a matched slot disables the place combobox @regression', async ({ page }) => {
    const playdates = new PlaydatesPage(page);
    const form = playdates.proposePlaydateForm;

    await playdates.goto();
    await form.selectFirstMatchedSlot();

    await expect(form.place).toBeDisabled();
  });

  test('place combobox lists Out / neutral place and My place when no slot is selected @regression', async ({
    page,
  }) => {
    const playdates = new PlaydatesPage(page);
    const form = playdates.proposePlaydateForm;

    await playdates.goto();

    await expect(form.place).toBeEnabled();
    await expect(form.placeOption(PlaydatePlaceOption.OutNeutral)).toBeAttached();
    await expect(form.placeOption(PlaydatePlaceOption.MyPlace)).toBeAttached();
  });

  test('child checkboxes use my children names and can be changed @regression', async ({ page }) => {
    const playdates = new PlaydatesPage(page);
    const form = playdates.proposePlaydateForm;
    const girl10 = getSpecChildByRole('aqpbt-9', 'girl10');
    const girl7 = getSpecChildByRole('aqpbt-9', 'girl7');

    await playdates.goto();
    await form.unselectChild(girl10.firstName);

    await expect(form.childCheckbox(girl10.firstName)).toBeVisible();
    await expect(form.childCheckbox(girl7.firstName)).toBeVisible();
    await expect(form.childCheckbox(girl10.firstName)).not.toBeChecked();
    await expect(page).toHaveURL(playdatesUrl);
  });

  test('empty Pending requests shows count 0 and empty copy @sanity', async ({ page }) => {
    const playdates = new PlaydatesPage(page);

    await playdates.goto();

    await expect(
      playdates.listCountBeside(playdates.pendingRequestsLabel, playdatesProposeObserved.emptyCount),
    ).toBeVisible();
    await expect(playdates.noPendingRequests).toHaveText(playdatesProposeObserved.pendingEmptyCopy);
  });

  test('empty Upcoming shows count 0 and empty copy @regression', async ({ page }) => {
    const playdates = new PlaydatesPage(page);

    await playdates.goto();

    await expect(
      playdates.listCountBeside(playdates.upcomingLabel, playdatesProposeObserved.emptyCount),
    ).toBeVisible();
    await expect(playdates.noUpcomingPlaydates).toHaveText(playdatesProposeObserved.upcomingEmptyCopy);
  });

  test('changing family refreshes matched slots @e2e', async ({ page }) => {
    const playdates = new PlaydatesPage(page);
    const form = playdates.proposePlaydateForm;

    await playdates.goto();
    await form.selectFamily(PlaydateCircleFamily.Petrovs);

    await expect(form.matchedSlotContaining(PlaydateCircleFamily.Petrovs).first()).toBeVisible();
  });

  test('Find a playdate route shows the same propose UI @api', async ({ page }) => {
    const playdates = new PlaydatesPage(page);

    await playdates.gotoNew();

    await expect(page).toHaveURL(newPlaydateUrl);
    await expect(playdates.heading).toHaveText(playdatesProposeObserved.heading);
    await expect(playdates.proposePanelTitle).toHaveText(playdatesProposeObserved.proposePanelTitle);
    await expect(playdates.proposePlaydateForm.submitButton).toHaveText(
      playdatesProposeObserved.sendRequest,
    );
  });

  test('optional location and note fields are visible on the propose form @regression', async ({ page }) => {
    const playdates = new PlaydatesPage(page);
    const form = playdates.proposePlaydateForm;

    await playdates.goto();

    await expect(form.locationNote).toBeVisible();
    await expect(form.optionalNote).toBeVisible();
  });

  test('child checkboxes start checked @regression', async ({ page }) => {
    const playdates = new PlaydatesPage(page);
    const form = playdates.proposePlaydateForm;
    const girl10 = getSpecChildByRole('aqpbt-9', 'girl10');
    const girl7 = getSpecChildByRole('aqpbt-9', 'girl7');

    await playdates.goto();

    await expect(form.childCheckbox(girl10.firstName)).toBeChecked();
    await expect(form.childCheckbox(girl7.firstName)).toBeChecked();
  });
});

test('Family B gate hides Propose and Send request @regression', async ({ browser }) => {
  test.skip(!isGateFamilyAuthConfigured(), GATE_FAMILY_SKIP_REASON);
  const context = await newGateFamilyContext(browser);
  const page = await context.newPage();
  try {
    const playdates = new PlaydatesPage(page);

    await playdates.goto();

    await expect(playdates.dashboardGateMessage).toContainText(
      invalidPlaydatesPropose.dashboardNotSetUpMessage,
    );
    await expect(playdates.proposePanelTitle).toHaveCount(0);
    await expect(playdates.proposePlaydateForm.submitButton).toHaveCount(0);
  } finally {
    await context.close();
  }
});
