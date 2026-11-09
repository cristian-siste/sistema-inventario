
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    crearProducto,
    obtenerCategorias,
    obtenerProveedores
} from "./services/api";
import "./NuevoProducto.css";

function NuevoProducto() {
    const navigate = useNavigate();

    // Información que se almacenará del nuevo producto.
    const [producto, setProducto] = useState({
        nombre: "",
        marca: "",
        codigo_producto: "",
        descripcion: "",
        unidad_medida: "Unidad",
        precioCompra: "",
        precioVenta: "",
        stock: "",
        stockMinimo: "",
        categoria_id: "",
        proveedor_id: ""
    });

    // Listas utilizadas en los campos de selección.
    const [categorias, setCategorias] = useState([]);
    const [proveedores, setProveedores] = useState([]);

    // Estados para controlar la carga y el registro.
    const [guardando, setGuardando] = useState(false);
    const [cargandoListas, setCargandoListas] = useState(true);

    // Cargar categorías y proveedores desde la API.
    useEffect(() => {
        const cargarListas = async () => {
            try {
                const [datosCategorias, datosProveedores] = await Promise.all([
                    obtenerCategorias(),
                    obtenerProveedores()
                ]);

                setCategorias(Array.isArray(datosCategorias) ? datosCategorias : []);
                setProveedores(Array.isArray(datosProveedores) ? datosProveedores : []);

            } catch (error) {
                console.error("Error cargando listas:", error);
                window.alert("No se pudieron cargar las categorías y los proveedores.");
            } finally {
                setCargandoListas(false);
            }
        };

        cargarListas();
    }, []);

    // Actualizar el estado cuando cambia cualquier campo.
    const cambiarDato = (e) => {
        const { name, value } = e.target;

        setProducto((anterior) => ({
            ...anterior,
            [name]: value
        }));
    };

    // Validar y registrar el producto en la base de datos.
    const guardarProducto = async (e) => {
        e.preventDefault();

        if (guardando) return;

        // Comprobar que los precios y las cantidades sean válidos.
        if (
            Number(producto.precioCompra) < 0 ||
            Number(producto.precioVenta) < 0 ||
            Number(producto.stock) < 0 ||
            Number(producto.stockMinimo) < 0
        ) {
            window.alert("Los precios y las cantidades no pueden ser negativos.");
            return;
        }

        setGuardando(true);

        try {
            // Preparar los datos que recibirá PHP.
            const nuevoProducto = {
                nombre: producto.nombre.trim(),
                marca: producto.marca.trim(),
                codigo_producto: producto.codigo_producto.trim(),
                descripcion: producto.descripcion.trim(),
                unidad_medida: producto.unidad_medida,
                precioCompra: Number(producto.precioCompra),
                precioVenta: Number(producto.precioVenta),
                stock: Number(producto.stock),
                stockMinimo: Number(producto.stockMinimo),
                categoria_id: Number(producto.categoria_id),
                proveedor_id: Number(producto.proveedor_id)
            };

            // Enviar el producto a la API.
            await crearProducto(nuevoProducto);

            window.alert("Producto registrado correctamente.");

            // Avisar a los demás componentes que los datos cambiaron.
            window.dispatchEvent(new Event("datosActualizados"));

            // Regresar al listado de productos.
            navigate("/productos");

        } catch (error) {
            console.error("Error al registrar el producto:", error);

            window.alert(
                "No se pudo registrar el producto: " +
                (error.message || "Error desconocido.")
            );

        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="contenedor">
            <h1>➕ Nuevo Producto</h1>

            <form className="formulario-producto" onSubmit={guardarProducto}>

                {/* Información general del producto */}
                <label>Nombre del producto</label>
                <input
                    type="text"
                    name="nombre"
                    value={producto.nombre}
                    onChange={cambiarDato}
                    placeholder="Ingrese el nombre del producto"
                    maxLength="100"
                    required
                />

                <label>Marca</label>
                <input
                    type="text"
                    name="marca"
                    value={producto.marca}
                    onChange={cambiarDato}
                    placeholder="Ejemplo: Lenovo, Logitech, Norma"
                    maxLength="100"
                />

                <label>Código del producto</label>
                <input
                    type="text"
                    name="codigo_producto"
                    value={producto.codigo_producto}
                    onChange={cambiarDato}
                    placeholder="Ejemplo: TEC-001"
                    maxLength="50"
                />

                <label>Descripción</label>
                <textarea
                    name="descripcion"
                    value={producto.descripcion}
                    onChange={cambiarDato}
                    placeholder="Ingrese la descripción"
                    maxLength="255"
                />

                {/* Unidad utilizada para controlar las existencias */}
                <label>Unidad de medida</label>
                <select
                    name="unidad_medida"
                    value={producto.unidad_medida}
                    onChange={cambiarDato}
                    required
                >
                    <option value="Unidad">Unidad</option>
                    <option value="Caja">Caja</option>
                    <option value="Paquete">Paquete</option>
                    <option value="Resma">Resma</option>
                    <option value="Litro">Litro</option>
                    <option value="Kilogramo">Kilogramo</option>
                    <option value="Metro">Metro</option>
                    <option value="Docena">Docena</option>
                </select>

                {/* Información financiera */}
                <label>Precio de compra</label>
                <input
                    type="number"
                    name="precioCompra"
                    value={producto.precioCompra}
                    onChange={cambiarDato}
                    min="0"
                    step="0.01"
                    required
                />

                <label>Precio de venta</label>
                <input
                    type="number"
                    name="precioVenta"
                    value={producto.precioVenta}
                    onChange={cambiarDato}
                    min="0"
                    step="0.01"
                    required
                />

                {/* Control de existencias */}
                <label>Stock inicial</label>
                <input
                    type="number"
                    name="stock"
                    value={producto.stock}
                    onChange={cambiarDato}
                    min="0"
                    step="1"
                    required
                />

                <label>Stock mínimo</label>
                <input
                    type="number"
                    name="stockMinimo"
                    value={producto.stockMinimo}
                    onChange={cambiarDato}
                    min="0"
                    step="1"
                    required
                />

                {/* Clasificación del producto */}
                <label>Categoría</label>
                <select
                    name="categoria_id"
                    value={producto.categoria_id}
                    onChange={cambiarDato}
                    required
                >
                    <option value="">Seleccione una categoría</option>

                    {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                            {categoria.nombre}
                        </option>
                    ))}
                </select>

                {/* Proveedor relacionado con el producto */}
                <label>Proveedor</label>
                <select
                    name="proveedor_id"
                    value={producto.proveedor_id}
                    onChange={cambiarDato}
                    required
                >
                    <option value="">Seleccione un proveedor</option>

                    {proveedores.map((proveedor) => (
                        <option key={proveedor.id} value={proveedor.id}>
                            {proveedor.nombre}
                        </option>
                    ))}
                </select>

                {/* Botón para guardar el producto */}
                <button
                    type="submit"
                    disabled={guardando || cargandoListas}
                >
                    {cargandoListas
                        ? "Cargando datos..."
                        : guardando
                            ? "Guardando..."
                            : "Guardar Producto"}
                </button>

            </form>
        </div>
    );
}

export default NuevoProducto;
