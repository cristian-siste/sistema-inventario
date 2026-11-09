
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Productos from "./Productos";
import { obtenerProductos } from "../services/api";

// Simular los servicios para no depender de la API real
vi.mock("../services/api", () => ({
    obtenerProductos: vi.fn(),
    eliminarProducto: vi.fn(),
}));

// Renderizar el componente dentro del enrutador
function renderProductos() {
    return render(
        <BrowserRouter>
            <Productos />
        </BrowserRouter>
    );
}

describe("Pruebas automatizadas del módulo Productos", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "error").mockImplementation(() => {});
        window.alert = vi.fn();
        window.confirm = vi.fn();
    });

    it("debe mostrar el título y el botón Nuevo Producto", async () => {
        obtenerProductos.mockResolvedValue([]);

        renderProductos();

        expect(
            screen.getByRole("heading", { name: "Productos" })
        ).toBeTruthy();

        expect(
            screen.getByRole("link", { name: "Nuevo Producto" })
        ).toBeTruthy();

        expect(
            await screen.findByText("No hay productos registrados.")
        ).toBeTruthy();
    });

    it("debe mostrar los productos recibidos", async () => {
        obtenerProductos.mockResolvedValue([
            {
                id: 1,
                nombre: "Teclado",
                descripcion: "Teclado USB",
                precioCompra: 30000,
                precioVenta: 45000,
                stock: 10,
                categoria: "Accesorios",
                proveedor: "Proveedor de prueba",
            },
        ]);

        renderProductos();

        expect(await screen.findByText("Teclado")).toBeTruthy();
        expect(screen.getByText("Teclado USB")).toBeTruthy();
        expect(screen.getByText("10")).toBeTruthy();

        expect(
            screen.getByRole("link", { name: "Editar" }).getAttribute("href")
        ).toBe("/editar-producto/1");
    });

    it("debe mostrar un mensaje cuando no hay productos", async () => {
        obtenerProductos.mockResolvedValue([]);

        renderProductos();

        expect(
            await screen.findByText("No hay productos registrados.")
        ).toBeTruthy();
    });

    it("debe mostrar un mensaje si falla la consulta", async () => {
        obtenerProductos.mockRejectedValue(
            new Error("Error de conexión de prueba")
        );

        renderProductos();

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Error: Error de conexión de prueba"
        );
    });
});
