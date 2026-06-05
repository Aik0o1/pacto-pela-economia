import React, { useEffect, useState, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, GeoJSON, Rectangle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../../Mapa.css';
import logMunicipios from '../../assets/piaui_municipios.json';
import regioes from '../../assets/municipios_regioes.json';

const regionColors = {
    "Planície Litorânea": "#1e51e8ff",      // Deep Sky Blue
    "Cocais": "#c3b74cff",                 // Orange Red
    "Carnaubais": "#356f22ff",             // Lime Green
    "Entre Rios": "#e29c2bff",             // Blue Violet
    "Vale do Sambito": "#f3e38bff",        // Gold
    "Vale do Rio Guaribas": "#c165e2ff",   // Dark Orange
    "Chapada do Vale do Rio Itaim": "#20B2AA", // Light Sea Green
    "Vale do Canindé": "#9b57b1ff",        // Steel Blue
    "Serra da Capivara": "#edd77eff",      // Crimson
    "Vale dos Rios Piauí e Itaueiras": "#b1acacff", // Dark Orchid
    "Tabuleiros do Alto Parnaíba": "#7c87daff", // Dark Red
    "Chapada das Mangabeiras": "#b99c7aff"  // Indigo
};

// Helper to normalize strings for comparison (ignore accents and case)
const normalize = (str) => {
    return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
};

// Realça múltiplas cidades no mapa (modo Evolução Geral)
const MapMultiHighlight = ({ cidadesSelecionadasGeral }) => {
    const map = useMap();

    useEffect(() => {
        const selectedSet = new Set(cidadesSelecionadasGeral);
        const hasSelection = cidadesSelecionadasGeral.length > 0;
        map.options.hasSelection = hasSelection;

        map.eachLayer((l) => {
            if (l.feature && l.feature.properties && l.setStyle) {
                const isSelected = selectedSet.has(l.feature.properties.name);
                l.options.selected = isSelected;
                l.setStyle({
                    weight: isSelected ? 3 : 1,
                    color: isSelected ? '#000' : 'white',
                    fillOpacity: (!isSelected && hasSelection) ? 0.4 : 1,
                });
                if (isSelected && l.bringToFront) l.bringToFront();
            }
        });
    }, [cidadesSelecionadasGeral, map]);

    return null;
};

const MapAutoZoom = ({ cidadeSelecionada, geoJsonData }) => {
    const map = useMap();

    useEffect(() => {
        // If the user clicks "Limpar Filtros", the nome comes back as "Selecione uma localidade"
        if (cidadeSelecionada && (cidadeSelecionada.nome === "Selecione uma localidade" || cidadeSelecionada.nome === "Piauí")) {
            map.options.hasSelection = false;
            // Reset to the original view
            map.flyTo([-6.4, -42.75], 7, { animate: true, duration: 1.5 });

            // Clear selections in the layers
            map.eachLayer((l) => {
                if (l.feature && l.setStyle) {
                    l.setStyle({
                        weight: 1,
                        color: 'black',
                        dashArray: '',
                        fillOpacity: 1
                    });
                }
            });
        } else if (cidadeSelecionada && cidadeSelecionada.id) {
            // Check if it's a multiple selection (Region) or single city
            const isMultiple = cidadeSelecionada.isRegion;
            const targetIds = isMultiple
                ? cidadeSelecionada.cidadesIds.map(String) // Cast numbers to strings
                : [String(cidadeSelecionada.id).replace('cidade-', '').trim()];

            map.options.hasSelection = targetIds.length > 0;

            const boundsToFit = [];

            // Find the layers matching the selected cities
            map.eachLayer((l) => {
                if (l.feature && l.feature.properties) {
                    const layerCodArea = String(l.feature.properties.codarea);

                    if (targetIds.includes(layerCodArea)) {
                        // Highlight it
                        l.options.selected = true;
                        if (l.setStyle) {
                            l.setStyle({
                                weight: 3,
                                color: '#000',
                                dashArray: '',
                            });
                            if (l.bringToFront) {
                                l.bringToFront();
                            }
                        }
                        if (l.getBounds) {
                            boundsToFit.push(l.getBounds());
                        }
                    } else {
                        // Turn off highlight for others
                        l.options.selected = false;
                        if (l.setStyle) {
                            l.setStyle({
                                weight: 1,
                                color: 'black',
                                dashArray: '',
                                fillOpacity: 0.4
                            });
                        }
                    }
                }
            });

            // Zoom and pan to fit all selected layers
            if (boundsToFit.length > 0) {
                // We MUST CLONE the bounds to avoid mutating internal Leaflet states!
                const masterBounds = L.latLngBounds(
                    boundsToFit[0].getSouthWest(),
                    boundsToFit[0].getNorthEast()
                );
                for (let i = 1; i < boundsToFit.length; i++) {
                    masterBounds.extend(boundsToFit[i]);
                }
                map.fitBounds(masterBounds, { padding: [100, 100], animate: true, duration: 1, maxZoom: 8 });
            }
        }
    }, [cidadeSelecionada, map]);

    return null;
}

const ALLOWED_CITIES = [
    "Betânia do Piauí",
    "Buriti dos Montes",
    "Campo Largo do Piauí",
    "Cocal dos Alves",
    "Coronel José Dias",
    "Cristino Castro",
    "Ipiranga do Piauí",
    "Jerumenha",
    "Monsenhor Gil",
    "São José do Peixe",
    "São José do Piauí",
    "Tanque do Piauí"
];

const MapLeaflet = ({ onCidadeSelecionada, cidades, cidadeSelecionada, modoMultiSelecao = false, cidadesSelecionadasGeral = [], onToggleCidade }) => {
    const [geoJsonData, setGeoJsonData] = useState(null);

    // Create a normalized lookup for regions
    const regioesNorm = useMemo(() => {
        const lookup = {};
        Object.keys(regioes).forEach(key => {
            lookup[normalize(key)] = regioes[key];
        });
        return lookup;
    }, []);

    useEffect(() => {
        if (logMunicipios && logMunicipios.features && cidades && cidades.length > 0) {
            const nomePorId = {};
            cidades.forEach(c => {
                const rawId = String(c.id).replace('cidade-', '');
                nomePorId[rawId] = c.nome;
            });

            const features = logMunicipios.features.map(feature => {
                const codarea = feature.properties.codarea;
                const nome = nomePorId[codarea] || "Desconhecido";

                // Try exact match then normalized match
                let regiao = regioes[nome];
                if (!regiao) {
                    regiao = regioesNorm[normalize(nome)];
                }

                if (!regiao) {
                    console.warn(`Município sem território encontrado: ${nome} (Cod: ${codarea})`);
                    regiao = "Desconhecido";
                }

                const isAllowed = ALLOWED_CITIES.includes(nome);

                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        name: nome, // Set name from API mapping
                        regiao,
                        color: isAllowed ? "#4ade80" : "#1e3a8a", // Lighter green for allowed, Darker blue for blocked
                        codarea,
                        isAllowed
                    }
                };
            });
            setGeoJsonData({ ...logMunicipios, features });
        }
    }, [cidades, regioesNorm]);

    if (!geoJsonData) return <div className="flex justify-center items-center h-[700px] bg-gray-50 rounded-lg text-gray-500">Carregando mapa...</div>;

    const mapStyle = {
        height: '700px',
        width: '100%',
        background: '#f8f9fa',
        borderRadius: '8px',
        overflow: 'hidden'
    };

    // Compute target targetIds once explicitly per render
    const isMultiple = cidadeSelecionada && cidadeSelecionada.isRegion;
    const targetIds = cidadeSelecionada && cidadeSelecionada.id
        ? (isMultiple
            ? cidadeSelecionada.cidadesIds.map(String)
            : [String(cidadeSelecionada.id).replace('cidade-', '').trim()])
        : [];

    return (
        <MapContainer
            center={[-6.4, -42.75]}
            zoom={7}
            style={mapStyle}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            {!modoMultiSelecao && (
                <MapAutoZoom cidadeSelecionada={cidadeSelecionada} geoJsonData={geoJsonData} />
            )}
            {modoMultiSelecao && (
                <MapMultiHighlight cidadesSelecionadasGeral={cidadesSelecionadasGeral} />
            )}

            <GeoJSON
                key={`${geoJsonData.features.length}-${modoMultiSelecao}`}
                data={geoJsonData}
                style={(feature) => {
                    if (modoMultiSelecao) {
                        const isSelected = cidadesSelecionadasGeral.includes(feature.properties.name);
                        return {
                            fillColor: feature.properties.color,
                            weight: isSelected ? 3 : 1,
                            opacity: 1,
                            color: isSelected ? '#000' : 'white',
                            dashArray: '',
                            fillOpacity: (!isSelected && cidadesSelecionadasGeral.length > 0) ? 0.4 : 1
                        };
                    }
                    const isSelected = targetIds.includes(String(feature.properties.codarea));
                    return {
                        fillColor: feature.properties.color,
                        weight: isSelected ? 3 : 1,
                        opacity: 1,
                        color: 'white',
                        dashArray: '',
                        fillOpacity: (targetIds.length > 0 && !isSelected) ? 0.4 : 1
                    };
                }}
                onEachFeature={(feature, layer) => {
                    const { name, regiao, codarea, isAllowed } = feature.properties;

                    if (!isAllowed) {
                        return;
                    }

                    layer.bindTooltip(`
                        <div style="font-family: sans-serif;">
                            <strong>${name}</strong><br/>
                            <span style="font-size: 0.9em;">${regiao}</span>
                        </div>
                    `, {
                        permanent: false,
                        direction: "top",
                        sticky: true
                    });

                    layer.on({
                        click: (e) => {
                            if (modoMultiSelecao && onToggleCidade) {
                                onToggleCidade(name);
                            } else {
                                const map = e.target._map;
                                map.fitBounds(e.target.getBounds(), { padding: [100, 100], maxZoom: 8 });
                                if (onCidadeSelecionada) {
                                    onCidadeSelecionada({ id: codarea, nome: name });
                                }
                            }
                        },
                        mouseover: (e) => {
                            const l = e.target;
                            const mapHasSelection = e.target._map?.options?.hasSelection;
                            l.setStyle({
                                weight: 3,
                                color: '#000',
                                dashArray: '',
                                fillOpacity: (!l.options.selected && mapHasSelection) ? 0.4 : 1
                            });
                            l.bringToFront();
                        },
                        mouseout: (e) => {
                            const l = e.target;
                            const mapHasSelection = e.target._map?.options?.hasSelection;
                            if (l.options.selected) {
                                l.setStyle({
                                    weight: 3,
                                    color: '#000',
                                    dashArray: '',
                                    fillOpacity: 1
                                });
                                l.bringToFront();
                            } else {
                                l.setStyle({
                                    weight: 1,
                                    color: modoMultiSelecao ? 'white' : 'black',
                                    dashArray: '',
                                    fillOpacity: mapHasSelection ? 0.4 : 1
                                });
                            }
                        }
                    });
                }}
            />
        </MapContainer>
    );
}

export default MapLeaflet;