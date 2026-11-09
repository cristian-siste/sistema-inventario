
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    obtenerProductos,
    obtenerUsuarios,
    crearEntrada,
    crearProducto,
    obtenerCategorias,
    obtenerProveedores
} from "./services/api";

import "./NuevaEntrada.css";

function NuevaEntrada() {
    const navigate = useNavigate();

    // Estados para almacenar la información consultada desde la API.
    const [productos, setProductos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [proveedores, setProveedores] = useState([]);

    // Estados para controlar la carga, el guardado y los errores.
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    // Estado con los datos del formulario de entrada.
    const [entrada, setEntrada] = useState({
        producto: "",
        cantidad: "",
        fecha: "",
        usuario: "",
        observacion: ""
    });

    // Estado con los datos necesarios para crear un producto nuevo.
    const [nuevoProducto, setNuevoProducto] = useState({
        nombre: "",
        descripcion: "",
        precioCompra: "",
        precioVenta: "",
        stock: "",
        stockMinimo: "5",
        categoria_id: "",
        proveedor_id: ""
    });

    // Normalizar las diferentes respuestas posibles de la API.
    const convertirLista = (respuesta, propiedad) => {
        if (Array.isArray(respuesta)) {
            return respuesta;
        }

        if (Array.isArray(respuesta?.datos)) {
            return respuesta.datos;
        }

        if (Array.isArray(respuesta?.[propiedad])) {
            return respuesta[propiedad];
        }

        return [];
    };

    // Cargar productos, usuarios, categorías y proveedores desde PHP.
    const cargarDatos = async () => {
        setCargando(true);
        setError("");

        try {
            const resultados = await Promise.all([
                obtenerProductos(),
                obtenerUsuarios(),
                obtenerCategorias(),
                obtenerProveedores()
            ]);

            setProductos(convertirLista(resultados[0], "productos"));
            setUsuarios(convertirLista(resultados[1], "usuarios"));
            setCategorias(convertirLista(resultados[2], "categorias"));
            setProveedores(convertirLista(resultados[3], "proveedores"));

        } catch (err) {
            console.error("Error cargando datos:", err);

            setError(
                err.message ||
                "No fue posible cargar productos, usuarios, categorías y proveedores."
            );

        } finally {
            setCargando(false);
        }
    };

    // Consultar los datos cuando se abre el formulario.
    useEffect(() => {
        cargarDatos();
    }, []);

    // Identificar el producto que el usuario seleccionó.
    const productoSeleccionado = productos.find(
        (producto) =>
            String(producto.id) === String(entrada.producto)
    );

    // Obtener el precio de compra del producto seleccionado.
    const precioUnitario = Number(
        productoSeleccionado?.precioCompra ??
        productoSeleccionado?.precio_compra ??
        productoSeleccionado?.costo_unitario ??
        0
    );

    // Calcular automáticamente el costo total de la entrada.
    const costoTotal =
        Number(entrada.cantidad || 0) * precioUnitario;

    // Mostrar los valores monetarios en pesos colombianos.
    const formatoMoneda = (valor) => {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(valor);
    };

    // Actualizar los campos del formulario de entrada.
    const cambiarEntrada = (e) => {
        const { name, value } = e.target;

        setEntrada((anterior) => ({
            ...anterior,
            [name]: value
        }));
    };

    // Actualizar los campos del formulario de producto nuevo.
    const cambiarProducto = (e) => {
        const { name, value } = e.target;

        setNuevoProducto((anterior) => ({
            ...anterior,
            [name]: value
        }));
    };

    // Registrar una entrada en la base de datos.
    const guardarEntrada = async (e) => {
        e.preventDefault();

        if (guardando) return;

        setError("");

        // Validar que se haya seleccionado un producto.
        if (!entrada.producto) {
            setError("Selecciona un producto.");
            return;
        }

        // Validar que la cantidad sea un entero positivo.
        const cantidad = Number(entrada.cantidad);

        if (!Number.isInteger(cantidad) || cantidad <= 0) {
            setError("La cantidad debe ser un entero mayor que cero.");
            return;
        }

        // Validar fecha y usuario responsable.
        if (!entrada.fecha || !entrada.usuario) {
            setError("Completa la fecha y el usuario responsable.");
            return;
        }

        // Comprobar que el producto seleccionado exista.
        if (!productoSeleccionado) {
            setError("No se encontró el producto seleccionado.");
            return;
        }

        // Validar que el precio unitario sea válido.
        if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
            setError("El precio unitario del producto no es válido.");
            return;
        }

        try {
            setGuardando(true);

            // Enviar la información completa de la entrada a PHP.
            const respuesta = await crearEntrada({
                producto_id: Number(productoSeleccionado.id),
                cantidad: cantidad,
                fecha: entrada.fecha,
                costo_unitario: precioUnitario,
                usuario: entrada.usuario,
                observacion: entrada.observacion
            });

            // Comprobar si la API informó algún error.
            if (respuesta?.error || respuesta?.success === false) {
                throw new Error(
                    respuesta.error || "No se pudo registrar la entrada."
                );
            }

            // Informar que la entrada fue registrada correctamente.
            alert(
                respuesta?.mensaje || "Entrada registrada correctamente."
            );

            // Volver al listado de entradas.
            navigate("/entradas");

        } catch (err) {
            console.error("Error registrando entrada:", err);

            setError(
                err.message || "No se pudo registrar la entrada en MySQL."
            );

        } finally {
            setGuardando(false);
        }
    };

    // Crear un producto nuevo en la base de datos.
    const guardarNuevoProducto = async (e) => {
        e.preventDefault();

        if (guardando) return;

        setError("");

        // Validar el nombre del producto.
        if (!nuevoProducto.nombre.trim()) {
            setError("Escribe el nombre del producto.");
            return;
        }

        // Convertir los valores numéricos del producto.
        const precioCompra = Number(nuevoProducto.precioCompra);
        const precioVenta = Number(nuevoProducto.precioVenta);
        const stock = Number(nuevoProducto.stock);
        const stockMinimo = Number(nuevoProducto.stockMinimo || 5);

        // Comprobar que los campos obligatorios estén completos.
        if (
            nuevoProducto.precioCompra === "" ||
            nuevoProducto.precioVenta === "" ||
            nuevoProducto.stock === "" ||
            !nuevoProducto.categoria_id ||
            !nuevoProducto.proveedor_id
        ) {
            setError(
                "Completa los precios, el stock, la categoría y el proveedor."
            );
            return;
        }

        // Validar los precios.
        if (
            !Number.isFinite(precioCompra) ||
            !Number.isFinite(precioVenta) ||
            precioCompra < 0 ||
            precioVenta < 0
        ) {
            setError("Los precios deben ser números válidos y no negativos.");
            return;
        }

        // Validar las cantidades de stock.
        if (
            !Number.isInteger(stock) ||
            stock < 0 ||
            !Number.isInteger(stockMinimo) ||
            stockMinimo < 0
        ) {
            setError("El stock y el stock mínimo deben ser enteros no negativos.");
            return;
        }

        try {
            setGuardando(true);

            // Preparar los datos que recibirá PHP.
            const datosProducto = {
                nombre: nuevoProducto.nombre.trim(),
                descripcion: nuevoProducto.descripcion.trim(),
                precioCompra,
                precioVenta,
                stock,
                stockMinimo,
                categoria_id: Number(nuevoProducto.categoria_id),
                proveedor_id: Number(nuevoProducto.proveedor_id)
            };

            // Guardar el producto en MySQL.
            const respuesta = await crearProducto(datosProducto);

            if (respuesta?.error || respuesta?.success === false) {
                throw new Error(
                    respuesta.error || "No se pudo crear el producto."
                );
            }

            // Volver a consultar la lista de productos.
            const respuestaProductos = await obtenerProductos();

            const listaProductos = convertirLista(
                respuestaProductos,
                "productos"
            );

            setProductos(listaProductos);

            // Buscar el producto que acaba de crearse.
            const productoCreado = listaProductos.find(
                (producto) =>
                    String(producto.nombre).toLowerCase() ===
                    datosProducto.nombre.toLowerCase()
            );

            // Seleccionar automáticamente el producto nuevo.
            if (productoCreado) {
                setEntrada((anterior) => ({
                    ...anterior,
                    producto: String(productoCreado.id)
                }));
            }

            // Limpiar el formulario de creación de productos.
            setNuevoProducto({
                nombre: "",
                descripcion: "",
                precioCompra: "",
                precioVenta: "",
                stock: "",
                stockMinimo: "5",
                categoria_id: "",
                proveedor_id: ""
            });

            alert(
                respuesta?.mensaje || "Producto creado correctamente."
            );

        } catch (err) {
            console.error("Error creando producto:", err);

            setError(
                err.message || "No se pudo guardar el producto en MySQL."
            );

        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="contenedor">

            <h1>⬇ Registrar Entrada</h1>

            {/* Mostrar los errores que devuelva el formulario o la API. */}
            {error && (
                <div
                    role="alert"
                    style={{
                        padding: "12px",
                        marginBottom: "16px",
                        color: "#b42332",
                        backgroundColor: "#fff0f0",
                        border: "1px solid #f2b8b8",
                        borderRadius: "6px"
                    }}
                >
                    {error}
                </div>
            )}

            {/* Formulario principal para registrar una entrada. */}
            <form
                className="formulario-entrada"
                onSubmit={guardarEntrada}
            >

                <label htmlFor="producto">Producto</label>

                <select
                    id="producto"
                    name="producto"
                    value={entrada.producto}
                    onChange={cambiarEntrada}
                    required
                    disabled={cargando || productos.length === 0 || guardando}
                >
                    <option value="">
                        {cargando
                            ? "Cargando productos..."
                            : productos.length === 0
                            ? "No hay productos disponibles"
                            : "Seleccione un producto"}
                    </option>

                    {productos.map((producto) => (
                        <option
                            key={producto.id}
                            value={String(producto.id)}
                        >
                            {producto.nombre} — Stock: {producto.stock}
                        </option>
                    ))}
                </select>

                <label htmlFor="cantidad">Cantidad ingresada</label>

                <input
                    id="cantidad"
                    type="number"
                    name="cantidad"
                    min="1"
                    step="1"
                    value={entrada.cantidad}
                    onChange={cambiarEntrada}
                    required
                    disabled={guardando}
                />

                {/* Mostrar el precio unitario del producto seleccionado. */}
                <label htmlFor="precioUnitario">Precio unitario</label>

                <input
                    id="precioUnitario"
                    type="text"
                    value={
                        productoSeleccionado
                            ? formatoMoneda(precioUnitario)
                            : ""
                    }
                    placeholder="Seleccione un producto"
                    readOnly
                />

                {/* Mostrar el costo total calculado automáticamente. */}
                <label htmlFor="costoTotal">Costo total</label>

                <input
                    id="costoTotal"
                    type="text"
                    value={
                        entrada.producto && entrada.cantidad
                            ? formatoMoneda(costoTotal)
                            : ""
                    }
                    placeholder="El costo total aparecerá aquí"
                    readOnly
                />

                <label htmlFor="fecha">Fecha</label>

                <input
                    id="fecha"
                    type="date"
                    name="fecha"
                    value={entrada.fecha}
                    onChange={cambiarEntrada}
                    required
                    disabled={guardando}
                />

                <label htmlFor="usuario">Usuario responsable</label>

                <select
                    id="usuario"
                    name="usuario"
                    value={entrada.usuario}
                    onChange={cambiarEntrada}
                    required
                    disabled={cargando || usuarios.length === 0 || guardando}
                >
                    <option value="">
                        {cargando
                            ? "Cargando usuarios..."
                            : usuarios.length === 0
                            ? "No hay usuarios disponibles"
                            : "Seleccione el usuario responsable"}
                    </option>

                    {usuarios.map((usuario) => (
                        <option
                            key={usuario.id}
                            value={usuario.nombre}
                        >
                            {usuario.nombre}
                        </option>
                    ))}
                </select>

                <label htmlFor="observacion">Observación</label>

                <textarea
                    id="observacion"
                    name="observacion"
                    value={entrada.observacion}
                    onChange={cambiarEntrada}
                    placeholder="Escriba una observación"
                    rows="4"
                    disabled={guardando}
                />

                {/* Botón para guardar la entrada. */}
                <button
                    type="submit"
                    disabled={
                        cargando ||
                        guardando ||
                        productos.length === 0 ||
                        usuarios.length === 0
                    }
                >
                    {guardando ? "Guardando..." : "Guardar Entrada"}
                </button>

                {/* Botón para regresar al listado sin guardar. */}
                <button
                    type="button"
                    onClick={() => navigate("/entradas")}
                    disabled={guardando}
                >
                    Cancelar
                </button>

            </form>

            {/* Formulario adicional para crear productos nuevos. */}
            <div className="crear-producto">

                <h2>➕ Crear Producto Nuevo</h2>

                <p>
                    Si el producto todavía no existe, puedes registrarlo aquí.
                    Después de crearlo, quedará seleccionado en el formulario
                    de entrada.
                </p>

                <form onSubmit={guardarNuevoProducto}>

                    <label htmlFor="nombre">Nombre del producto</label>

                    <input
                        id="nombre"
                        type="text"
                        name="nombre"
                        value={nuevoProducto.nombre}
                        onChange={cambiarProducto}
                        placeholder="Ejemplo: Lápiz"
                        required
                        disabled={guardando}
                    />

                    <label htmlFor="descripcion">Descripción</label>

                    <textarea
                        id="descripcion"
                        name="descripcion"
                        value={nuevoProducto.descripcion}
                        onChange={cambiarProducto}
                        placeholder="Descripción del producto"
                        disabled={guardando}
                    />

                    <label htmlFor="precioCompra">Precio de compra</label>

                    <input
                        id="precioCompra"
                        type="number"
                        name="precioCompra"
                        min="0"
                        step="0.01"
                        value={nuevoProducto.precioCompra}
                        onChange={cambiarProducto}
                        required
                        disabled={guardando}
                    />

                    <label htmlFor="precioVenta">Precio de venta</label>

                    <input
                        id="precioVenta"
                        type="number"
                        name="precioVenta"
                        min="0"
                        step="0.01"
                        value={nuevoProducto.precioVenta}
                        onChange={cambiarProducto}
                        required
                        disabled={guardando}
                    />

                    <label htmlFor="stock">Stock inicial</label>

                    <input
                        id="stock"
                        type="number"
                        name="stock"
                        min="0"
                        step="1"
                        value={nuevoProducto.stock}
                        onChange={cambiarProducto}
                        required
                        disabled={guardando}
                    />

                    <label htmlFor="stockMinimo">Stock mínimo</label>

                    <input
                        id="stockMinimo"
                        type="number"
                        name="stockMinimo"
                        min="0"
                        step="1"
                        value={nuevoProducto.stockMinimo}
                        onChange={cambiarProducto}
                        disabled={guardando}
                    />

                    <label htmlFor="categoria_id">Categoría</label>

                    <select
                        id="categoria_id"
                        name="categoria_id"
                        value={nuevoProducto.categoria_id}
                        onChange={cambiarProducto}
                        required
                        disabled={cargando || guardando}
                    >
                        <option value="">Seleccione una categoría</option>

                        {categorias.map((categoria) => (
                            <option
                                key={categoria.id}
                                value={String(categoria.id)}
                            >
                                {categoria.nombre}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="proveedor_id">Proveedor</label>

                    <select
                        id="proveedor_id"
                        name="proveedor_id"
                        value={nuevoProducto.proveedor_id}
                        onChange={cambiarProducto}
                        required
                        disabled={cargando || guardando}
                    >
                        <option value="">Seleccione un proveedor</option>

                        {proveedores.map((proveedor) => (
                            <option
                                key={proveedor.id}
                                value={String(proveedor.id)}
                            >
                                {proveedor.nombre}
                            </option>
                        ))}
                    </select>

                    {/* Botón para guardar el producto nuevo. */}
                    <button
                        type="submit"
                        disabled={cargando || guardando}
                    >
                        {guardando ? "Guardando..." : "Crear Producto"}
                    </button>

                </form>
            </div>

        </div>
    );
}

export default NuevaEntrada;
