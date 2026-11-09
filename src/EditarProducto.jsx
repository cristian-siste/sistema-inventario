
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    obtenerProductos,
    actualizarProducto,
    obtenerCategorias,
    obtenerProveedores
} from "./services/api";

function EditarProducto() {

    // Obtiene el identificador del producto desde la dirección.
    const { id } = useParams();

    // Permite navegar a otras páginas.
    const navigate = useNavigate();

    // Almacena los datos del producto que se está editando.
    const [producto, setProducto] = useState({
        nombre: "",
        marca: "",
        codigo_producto: "",
        unidad_medida: "Unidad",
        descripcion: "",
        precioCompra: "",
        precioVenta: "",
        stock: "",
        stockMinimo: "",
        categoria_id: "",
        proveedor_id: ""
    });

    // Almacena las categorías y los proveedores disponibles.
    const [categorias, setCategorias] = useState([]);
    const [proveedores, setProveedores] = useState([]);

    // Controla los estados de carga y actualización.
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);


    // =====================================================
    // 1. CARGAR PRODUCTO, CATEGORÍAS Y PROVEEDORES
    // =====================================================

    useEffect(() => {

        const cargarDatos = async () => {

            try {

                // Consulta simultáneamente los datos necesarios.
                const [
                    productos,
                    listaCategorias,
                    listaProveedores
                ] = await Promise.all([
                    obtenerProductos(),
                    obtenerCategorias(),
                    obtenerProveedores()
                ]);

                // Busca el producto que corresponde al ID de la ruta.
                const actual = productos.find(
                    (item) => String(item.id) === String(id)
                );

                // Si no existe, regresa al listado.
                if (!actual) {
                    window.alert("No se encontró el producto.");
                    navigate("/productos");
                    return;
                }

                // Carga los datos actuales del producto en el formulario.
                setProducto({
                    nombre: actual.nombre ?? "",
                    marca: actual.marca ?? "",
                    codigo_producto: actual.codigo_producto ?? "",
                    unidad_medida: actual.unidad_medida || "Unidad",
                    descripcion: actual.descripcion ?? "",
                    precioCompra: actual.precioCompra ?? "",
                    precioVenta: actual.precioVenta ?? "",
                    stock: actual.stock ?? "",
                    stockMinimo: actual.stockMinimo ?? "",
                    categoria_id: actual.categoria_id ?? "",
                    proveedor_id: actual.proveedor_id ?? ""
                });

                // Guarda las categorías y proveedores recibidos.
                setCategorias(
                    Array.isArray(listaCategorias) ? listaCategorias : []
                );

                setProveedores(
                    Array.isArray(listaProveedores) ? listaProveedores : []
                );

            } catch (error) {

                console.error("Error cargando el producto:", error);

                window.alert(
                    "No se pudo cargar el producto: " + error.message
                );

            } finally {

                // Finaliza el indicador de carga.
                setCargando(false);
            }
        };

        cargarDatos();

    }, [id, navigate]);


    // =====================================================
    // 2. CONTROLAR LOS CAMBIOS DEL FORMULARIO
    // =====================================================

    const cambiarDato = (e) => {

        const { name, value } = e.target;

        // Actualiza únicamente el campo que modificó el usuario.
        setProducto((anterior) => ({
            ...anterior,
            [name]: value
        }));
    };


    // =====================================================
    // 3. ACTUALIZAR EL PRODUCTO
    // =====================================================

    const actualizar = async (e) => {

        e.preventDefault();

        // Evita enviar varias actualizaciones al mismo tiempo.
        if (guardando) return;

        setGuardando(true);

        try {

            // Organiza los datos antes de enviarlos a PHP.
            const datos = {

                nombre: producto.nombre.trim(),

                // Nuevos campos del producto.
                marca: producto.marca.trim(),
                codigo_producto: producto.codigo_producto.trim(),
                unidad_medida: producto.unidad_medida,

                descripcion: producto.descripcion.trim(),

                // Convierte los valores numéricos.
                precioCompra: Number(producto.precioCompra),
                precioVenta: Number(producto.precioVenta),
                stock: Number(producto.stock),
                stockMinimo: Number(producto.stockMinimo),

                // Conserva las relaciones con categoría y proveedor.
                categoria_id: Number(producto.categoria_id),
                proveedor_id: Number(producto.proveedor_id)
            };

            // Envía los cambios al servicio de la API.
            await actualizarProducto(id, datos);

            // Notifica a los demás componentes que hay datos nuevos.
            window.dispatchEvent(new Event("datosActualizados"));

            window.alert("Producto actualizado correctamente.");

            // Regresa al listado de productos.
            navigate("/productos");

        } catch (error) {

            console.error("Error actualizando el producto:", error);

            window.alert(
                "No se pudo actualizar el producto: " +
                (error.message || "Error desconocido.")
            );

        } finally {

            // Habilita nuevamente el botón.
            setGuardando(false);
        }
    };


    // =====================================================
    // 4. INDICADOR DE CARGA
    // =====================================================

    if (cargando) {
        return <div className="contenedor">Cargando producto...</div>;
    }


    // =====================================================
    // 5. FORMULARIO DE EDICIÓN
    // =====================================================

    return (

        <div className="contenedor">

            <h1>Editar Producto</h1>

            <form onSubmit={actualizar}>

                <label>Nombre del producto</label>
                <input
                    type="text"
                    name="nombre"
                    value={producto.nombre}
                    onChange={cambiarDato}
                    required
                />


                {/* Campos nuevos de identificación del producto */}

                <label>Marca</label>
                <input
                    type="text"
                    name="marca"
                    value={producto.marca}
                    onChange={cambiarDato}
                    maxLength="100"
                    placeholder="Ingrese la marca"
                />

                <label>Código del producto</label>
                <input
                    type="text"
                    name="codigo_producto"
                    value={producto.codigo_producto}
                    onChange={cambiarDato}
                    maxLength="50"
                    placeholder="Ingrese un código único"
                />

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


                <label>Descripción</label>
                <input
                    type="text"
                    name="descripcion"
                    value={producto.descripcion}
                    onChange={cambiarDato}
                />


                <label>Precio de compra</label>
                <input
                    type="number"
                    name="precioCompra"
                    min="0"
                    step="0.01"
                    value={producto.precioCompra}
                    onChange={cambiarDato}
                    required
                />


                <label>Precio de venta</label>
                <input
                    type="number"
                    name="precioVenta"
                    min="0"
                    step="0.01"
                    value={producto.precioVenta}
                    onChange={cambiarDato}
                    required
                />


                <label>Stock</label>
                <input
                    type="number"
                    name="stock"
                    min="0"
                    step="1"
                    value={producto.stock}
                    onChange={cambiarDato}
                    required
                />


                <label>Stock mínimo</label>
                <input
                    type="number"
                    name="stockMinimo"
                    min="0"
                    step="1"
                    value={producto.stockMinimo}
                    onChange={cambiarDato}
                    required
                />


                <label>Categoría</label>
                <select
                    name="categoria_id"
                    value={producto.categoria_id}
                    onChange={cambiarDato}
                    required
                >
                    <option value="">Seleccione una categoría</option>

                    {categorias.map((categoria) => (
                        <option
                            key={categoria.id}
                            value={categoria.id}
                        >
                            {categoria.nombre}
                        </option>
                    ))}
                </select>


                <label>Proveedor</label>
                <select
                    name="proveedor_id"
                    value={producto.proveedor_id}
                    onChange={cambiarDato}
                    required
                >
                    <option value="">Seleccione un proveedor</option>

                    {proveedores.map((proveedor) => (
                        <option
                            key={proveedor.id}
                            value={proveedor.id}
                        >
                            {proveedor.nombre}
                        </option>
                    ))}
                </select>


                {/* Botón que envía el formulario */}
                <button type="submit" disabled={guardando}>
                    {guardando ? "Guardando..." : "Actualizar Producto"}
                </button>

            </form>

        </div>
    );
}

export default EditarProducto;
