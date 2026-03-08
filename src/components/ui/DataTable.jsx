import React from 'react';

/**
 * Standardized Data Table
 * Forces consistent striped rows, hover highlights, and cell padding.
 */
export default function DataTable({
    headers = [],
    data = [],
    keyExtractor = (item, index) => index,
    renderRow
}) {
    return (
        <div className="table-responsive" style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ backgroundColor: 'var(--surface)', borderBottom: '2px solid var(--border)' }}>
                        {headers.map((h, i) => (
                            <th
                                key={i}
                                style={{
                                    padding: '1rem',
                                    fontWeight: 600,
                                    color: 'var(--text-main)',
                                    textTransform: 'uppercase',
                                    fontSize: '0.8rem',
                                    letterSpacing: '0.05em'
                                }}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={headers.length} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No data available.
                            </td>
                        </tr>
                    ) : (
                        data.map((item, index) => (
                            <tr
                                key={keyExtractor(item, index)}
                                style={{
                                    borderBottom: '1px solid var(--border-light)',
                                    transition: 'background-color 150ms ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-warm)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                {renderRow ? renderRow(item, index) : Object.values(item).map((val, cellIdx) => (
                                    <td key={cellIdx} style={{ padding: '1rem', color: 'var(--text-dark)' }}>
                                        {val}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
