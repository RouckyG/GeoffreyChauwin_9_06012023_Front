/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom"

import userEvent from "@testing-library/user-event" 
import {screen, waitFor} from "@testing-library/dom"
import Bills from "../containers/Bills.js"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {

    beforeEach(()=> {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
			Object.defineProperty(window, "location", { value: { hash: ROUTES_PATH.Bills } });
			window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
			document.body.innerHTML = '<div id="root"></div>';
			router();
    })

    afterEach(()=> {
      document.body.innerHTML = '';
    })

    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList).toContain('active-icon')
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    describe("When I click on create a new bill button,", () => {
      test("Then I should be directed to the create a new bill page",() => {
        document.body.innerHTML = BillsUI({ data: bills })
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const billsView = new Bills({document, onNavigate, store : null, localStorage: window.localStorage})
        const handleClickNewBill = jest.fn(billsView.handleClickNewBill)
        const newBillButton = screen.getByTestId('btn-new-bill')
        newBillButton.addEventListener('click', handleClickNewBill())
        userEvent.click(newBillButton)
        expect(handleClickNewBill).toHaveBeenCalled()
        expect(screen.getByText('Envoyer une note de frais')).toBeTruthy()
      })
    })

    describe("When I click on the eye icon of a bill,", () => {
      test("Then the file should appear in a lightbox", () => {
        $.fn.modal = jest.fn();
        document.body.innerHTML = BillsUI({ data: bills })
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const billsView = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage });
        const handleClickIconEye = jest.fn(billsView.handleClickIconEye)
        const eyeIcon = screen.getAllByTestId('icon-eye')[0]
        eyeIcon.addEventListener('click', handleClickIconEye(eyeIcon))
        userEvent.click(eyeIcon)
        expect(handleClickIconEye).toHaveBeenCalled()
        expect(screen.getByText(`Justificatif`)).toBeTruthy();
      })
    })

    test("then bills are fetched from the API and it fails with a 404 message error", async () => {

      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})

      // Go to employee dashboard.
      window.onNavigate(ROUTES_PATH.Bills)

      await new Promise(process.nextTick)
      const message = await screen.findByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("then bills are fetched from the API and it fails with a 500 message error", async () => {

      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      // Go to employee dashboard.
      window.onNavigate(ROUTES_PATH.Bills)

      await new Promise(process.nextTick)
      const message = await screen.findByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })

})

