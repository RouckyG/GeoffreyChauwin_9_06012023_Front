/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom"

import userEvent from "@testing-library/user-event" 
import {fireEvent, screen, waitFor} from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import store from '../app/store'

import router from "../app/Router.js";

window.alert = jest.fn()

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    
    beforeEach(()=> {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
			Object.defineProperty(window, "location", { value: { hash: ROUTES_PATH.NewBill } });
			window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
			document.body.innerHTML = '<div id="root"></div>';
			router();
    })

    afterEach(()=> {
      document.body.innerHTML = '';
    })

    test("Then new bill icon in vertical layout should be highlighted", async () => {
      await waitFor(() => screen.getByTestId('icon-mail'))
      const windowIcon = screen.getByTestId('icon-mail')
      expect(windowIcon.classList).toContain('active-icon')
    })

    describe("When I fill the form", ()=>{

      const imageFileMock = new File(['test'], 'test.png', { type: 'image/png' })
      const imageBadFileMock = new File(['test'], 'test.pdf', { type: 'application/pdf' })

      const expectedPostData = [
        ['type', 'Equipement et matériel'],
        ['name', 'PC Asus ROG Strix'],
        ['date', '2022-07-31'],
        ['amount', '1700'],
        ['vat', '170'],
        ['pct', '10'],
        ['commentary', 'Ryzen 7 5800X - 16Go - RTX 3060 - 1To SSD NVMe M.2'],
        ['email', 'employee@company.test'],
        ['status', 'pending'],
        ['file', expect.objectContaining({
          name: 'test.png',
          size: imageFileMock.size,
          type: 'image/png',
        })],
      ]

      const expectedPostResponse = {
        fileUrl: 'https://localhost:3456/images/test.jpg',
        key: '1234',
      }

      describe("when I select a file with a bad extension and submit", ()=>{

        test("it should call a error message", ()=>{
          const form = {
            type: screen.getByTestId(`expense-type`),
            name: screen.getByTestId('expense-name'),
            date: screen.getByTestId('datepicker'),
            amount: screen.getByTestId('amount'),
            vat: screen.getByTestId('vat'),
            pct: screen.getByTestId('pct'),
            commentary: screen.getByTestId('commentary'),
            file: screen.getByTestId('file'),
            submit: screen.getByText('Envoyer'),
          }

          fireEvent.change(form.type, { target: { selectedIndex: 5 } })
          userEvent.type(form.name, 'PC Asus ROG Strix')
          fireEvent.change(form.date, { target: { value: "2022-07-31" } })
          userEvent.type(form.amount, '1700')
          userEvent.type(form.vat, '170')
          userEvent.type(form.pct, '10')
          userEvent.type(form.commentary, 'Ryzen 7 5800X - 16Go - RTX 3060 - 1To SSD NVMe M.2')

          fireEvent.change(form.file, { target: { files: [imageBadFileMock] } })
          userEvent.click(form.submit)

          expect(window.alert).toHaveBeenCalledWith(`Veuillez selectionner une image au format jpg, jpeg ou png.`)
        })
      })

      describe("when I select a file with a correct extension and submit", ()=>{
        test("it should submit without problem", ()=>{
          
          const currentNewBill = new NewBill({
            document,
            onNavigate,
            store: null,
            localStorage: window.localStorage,
          })
          
          document.body.innerHTML = NewBillUI()
          new NewBill({
            document,
            onNavigate,
            store: mockStore,
            localStorage: window.localStorage,
          })

          const form = {
            container: screen.getByTestId('form-new-bill'),
            type: screen.getByTestId(`expense-type`),
            name: screen.getByTestId('expense-name'),
            date: screen.getByTestId('datepicker'),
            amount: screen.getByTestId('amount'),
            vat: screen.getByTestId('vat'),
            pct: screen.getByTestId('pct'),
            commentary: screen.getByTestId('commentary'),
            file: screen.getByTestId('file'),
            submit: screen.getByText('Envoyer'),
          }

          fireEvent.change(form.type, { target: { selectedIndex: 5 } })
          userEvent.type(form.name, 'PC Asus ROG Strix')
          fireEvent.change(form.date, { target: { value: "2022-07-31" } })
          userEvent.type(form.amount, '1700')
          userEvent.type(form.vat, '170')
          userEvent.type(form.pct, '10')
          userEvent.type(form.commentary, 'Ryzen 7 5800X - 16Go - RTX 3060 - 1To SSD NVMe M.2')

          fireEvent.change(form.file, { target: { files: [imageFileMock] } })
          userEvent.click(form.submit)

          currentNewBill.updateBill = jest.fn()
          const handleSubmit = jest.fn((e) => currentNewBill.handleSubmit(e))

          form.container.addEventListener('submit', handleSubmit)
          expect(screen.getByText('Envoyer').type).toBe('submit')

          userEvent.click(screen.getByText('Envoyer'))

          expect(handleSubmit).toHaveBeenCalled()
          expect(currentNewBill.updateBill).toHaveBeenCalled()
        })
      })
    })

    //Errors 404 and 500 test
    describe('When an error occurs on API', () => {
      test('create bills from an API and fails with 404 message error', async () => {
        jest.spyOn(store, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )

      store.bills.mockImplementationOnce(() => {
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

      test('fetches messages from an API and fails with 500 message error', async () => {
        jest.spyOn(store, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )

      store.bills.mockImplementationOnce(() => {
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
})
