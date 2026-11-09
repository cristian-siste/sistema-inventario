import { NavLink } from "react-router-dom";
import "./Sidebar.css";

// Menú lateral principal del sistema de inventario.
function Sidebar() {
    return (
        <aside className="sidebar">
            {/* Logo y nombre del sistema */}
            <div className="logo">
                <h2>📦 Inventario</h2>
                <span>Sistema Online</span>
            </div>

            {/* Opciones de navegación */}
            <nav className="menu">
                <NavLink to="/dashboard">
                    <span>🏠</span> Dashboard
                </NavLink>

                <NavLink to="/productos">
                    <span>📦</span> Productos
                </NavLink>

                <NavLink to="/consultar-productos">
                    <span>🔎</span> Consultar Productos
                </NavLink>

                <NavLink to="/categorias">
                    <span>🗂️</span> Categorías
                </NavLink>

                <NavLink to="/proveedores">
                    <span>🚚</span> Proveedores
                </NavLink>

                <NavLink to="/compras">
                    <span>🛒</span> Compras
                </NavLink>

                <NavLink to="/entradas">
                    <span>⬇️</span> Entradas
                </NavLink>

                <NavLink to="/salidas">
                    <span>⬆️</span> Salidas
                </NavLink>

                <NavLink to="/usuarios">
                    <span>👥</span> Usuarios
                </NavLink>

                <NavLink to="/reportes">
                    <span>📊</span> Reportes
                </NavLink>
            </nav>

            {/* Enlace para cerrar sesión */}
            <div className="logout">
                <NavLink to="/">
                    <span>🚪</span> Cerrar Sesión
                </NavLink>
            </div>
        </aside>
    );
}

export default Sidebar;