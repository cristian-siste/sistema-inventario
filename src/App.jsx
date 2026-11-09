/*
 * ARCHIVO: App.jsx
 * PROPÓSITO:
 * Configurar la navegación principal del sistema de inventario.
 *
 * BrowserRouter: habilita la navegación entre páginas.
 * Routes: agrupa todas las rutas de la aplicación.
 * Route: relaciona una dirección URL con un componente React.
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";

// ==================================================
// IMPORTACIÓN DE LAS PÁGINAS PRINCIPALES
// ==================================================

// Página de inicio del sistema.
import Inicio from "./pages/Inicio";

// Página para iniciar sesión.
import Login from "./pages/Login";

// Panel principal con el resumen del inventario.
import Dashboard from "./pages/Dashboard";

// ==================================================
// IMPORTACIÓN DE LAS PÁGINAS DE PRODUCTOS
// ==================================================

// Lista los productos registrados en el sistema.
import Productos from "./pages/Productos";

// Formulario para registrar un producto nuevo.
import NuevoProducto from "./NuevoProducto";

// Formulario para modificar un producto existente.
import EditarProducto from "./EditarProducto";

// Página para consultar productos.
import ConsultarProductos from "./pages/ConsultarProductos";

// ==================================================
// IMPORTACIÓN DE LAS PÁGINAS DE CATEGORÍAS
// ==================================================

// Muestra las categorías registradas.
import Categorias from "./pages/Categorias";

// Formulario para crear una categoría.
import NuevaCategoria from "./pages/NuevaCategoria";

// Formulario para editar una categoría existente.
import EditarCategoria from "./pages/EditarCategoria";

// ==================================================
// IMPORTACIÓN DE LAS PÁGINAS DE PROVEEDORES
// ==================================================

// Muestra la lista de proveedores.
import Proveedores from "./pages/Proveedores";

// Formulario para registrar un proveedor.
import NuevoProveedor from "./pages/NuevoProveedor";

// Formulario para modificar los datos de un proveedor.
import EditarProveedor from "./pages/EditarProveedor";

// ==================================================
// IMPORTACIÓN DE LAS PÁGINAS DE COMPRAS
// ==================================================

// NUEVO: muestra las órdenes de compra registradas,
// sus proveedores, productos, totales y estados.
import Compras from "./pages/Compras";

// NUEVO: permite crear una orden de compra,
// seleccionar el proveedor y agregar sus productos.
import NuevaCompra from "./pages/NuevaCompra";

// ==================================================
// IMPORTACIÓN DE LAS PÁGINAS DE ENTRADAS
// ==================================================

// Muestra los movimientos de entrada al inventario.
import Entradas from "./Entradas";

// Formulario para registrar una entrada.
import NuevaEntrada from "./NuevaEntrada";

// Formulario para editar una entrada existente.
import EditarEntrada from "./EditarEntrada";

// ==================================================
// IMPORTACIÓN DE LAS PÁGINAS DE SALIDAS
// ==================================================

// Muestra las salidas de productos del inventario.
import Salidas from "./Salidas";

// Formulario para registrar una salida.
import NuevaSalida from "./NuevaSalida";

// Formulario para editar una salida existente.
import EditarSalida from "./EditarSalida";

// ==================================================
// IMPORTACIÓN DE USUARIOS Y REPORTES
// ==================================================

// Muestra los usuarios del sistema.
import Usuarios from "./pages/Usuarios";

// Formulario para crear un usuario.
import NuevoUsuario from "./pages/NuevoUsuario";

// Formulario para editar un usuario existente.
import EditarUsuario from "./pages/EditarUsuario";

// Muestra los reportes del inventario.
import Reportes from "./pages/Reportes";

// ==================================================
// FUNCIÓN PRINCIPAL DE LA APLICACIÓN
// ==================================================

function App() {

    /*
     * Esta función devuelve la estructura de navegación.
     * Cada Route define una dirección y la página que
     * React debe mostrar cuando se visita esa dirección.
     */

    return (

        // Activa el sistema de navegación de React Router.
        <BrowserRouter>

            {/* Agrupa todas las rutas disponibles. */}
            <Routes>

                {/* ======================================
                   INICIO Y ACCESO AL SISTEMA
                   ====================================== */}

                {/* Página inicial. */}
                <Route
                    path="/"
                    element={<Inicio />}
                />

                {/* Página de inicio de sesión. */}
                <Route
                    path="/login"
                    element={<Login />}
                />

                {/* Panel principal del sistema. */}
                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />

                {/* ======================================
                   RUTAS DE PRODUCTOS
                   ====================================== */}

                {/* Lista todos los productos. */}
                <Route
                    path="/productos"
                    element={<Productos />}
                />

                {/* Abre el formulario para crear productos. */}
                <Route
                    path="/nuevo-producto"
                    element={<NuevoProducto />}
                />

                {/* Abre el formulario para editar un producto.
                    El parámetro :id identifica el producto. */}
                <Route
                    path="/editar-producto/:id"
                    element={<EditarProducto />}
                />

                {/* Permite consultar productos. */}
                <Route
                    path="/consultar-productos"
                    element={<ConsultarProductos />}
                />

                {/* ======================================
                   RUTAS DE CATEGORÍAS
                   ====================================== */}

                {/* Lista las categorías existentes. */}
                <Route
                    path="/categorias"
                    element={<Categorias />}
                />

                {/* Abre el formulario para crear categorías. */}
                <Route
                    path="/nueva-categoria"
                    element={<NuevaCategoria />}
                />

                {/* Edita una categoría según su identificador. */}
                <Route
                    path="/editar-categoria/:id"
                    element={<EditarCategoria />}
                />

                {/* ======================================
                   RUTAS DE PROVEEDORES
                   ====================================== */}

                {/* Lista los proveedores registrados. */}
                <Route
                    path="/proveedores"
                    element={<Proveedores />}
                />

                {/* Abre el formulario para crear proveedores. */}
                <Route
                    path="/nuevo-proveedor"
                    element={<NuevoProveedor />}
                />

                {/* Edita un proveedor según su identificador. */}
                <Route
                    path="/editar-proveedor/:id"
                    element={<EditarProveedor />}
                />

                {/* ======================================
                   RUTAS DE COMPRAS
                   ====================================== */}

                {/* NUEVO:
                    Muestra las órdenes de compra guardadas
                    en la base de datos. */}
                <Route
                    path="/compras"
                    element={<Compras />}
                />

                {/* NUEVO:
                    Abre el formulario para registrar una
                    nueva orden de compra. */}
                <Route
                    path="/nueva-compra"
                    element={<NuevaCompra />}
                />

                {/* ======================================
                   RUTAS DE ENTRADAS
                   ====================================== */}

                {/* Lista las entradas de productos. */}
                <Route
                    path="/entradas"
                    element={<Entradas />}
                />

                {/* Abre el formulario para registrar entradas. */}
                <Route
                    path="/nueva-entrada"
                    element={<NuevaEntrada />}
                />

                {/* Edita una entrada usando su identificador. */}
                <Route
                    path="/editar-entrada/:id"
                    element={<EditarEntrada />}
                />

                {/* ======================================
                   RUTAS DE SALIDAS
                   ====================================== */}

                {/* Lista las salidas de productos. */}
                <Route
                    path="/salidas"
                    element={<Salidas />}
                />

                {/* Abre el formulario para registrar salidas. */}
                <Route
                    path="/nueva-salida"
                    element={<NuevaSalida />}
                />

                {/* Edita una salida según su identificador. */}
                <Route
                    path="/editar-salida/:id"
                    element={<EditarSalida />}
                />

                {/* ======================================
                   RUTAS DE USUARIOS
                   ====================================== */}

                {/* Lista los usuarios registrados. */}
                <Route
                    path="/usuarios"
                    element={<Usuarios />}
                />

                {/* Abre el formulario para crear usuarios. */}
                <Route
                    path="/nuevo-usuario"
                    element={<NuevoUsuario />}
                />

                {/* Edita un usuario según su identificador. */}
                <Route
                    path="/editar-usuario/:id"
                    element={<EditarUsuario />}
                />

                {/* ======================================
                   RUTAS DE REPORTES
                   ====================================== */}

                {/* Muestra los reportes del inventario. */}
                <Route
                    path="/reportes"
                    element={<Reportes />}
                />

            </Routes>

        </BrowserRouter>
    );
}

// Exporta App para que el punto de entrada del proyecto
// pueda cargar y mostrar la aplicación.
export default App;