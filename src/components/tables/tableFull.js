import React, { useState, useEffect, useMemo } from 'react';
import { Box, Stack } from '@mui/material';
import {
  MaterialReactTable,
  useMaterialReactTable
} from "material-react-table";

export default function TableFull ({operatorsListMain}) {
  const [operatorsList, setOperatorsList] = useState(operatorsListMain)

  const statAverageHealth = useMemo(
    () => operatorsList.reduce((acc, curr) => acc + curr.combat_hp, 0) / operatorsList.length,
    [],
  );
  const statAverageAttack = useMemo(
    () => operatorsList.reduce((acc, curr) => acc + curr.combat_atk, 0) / operatorsList.length,
    [],
  );
  const statAverageDefense = useMemo(
    () => operatorsList.reduce((acc, curr) => acc + curr.combat_def, 0) / operatorsList.length,
    [],
  );
  const statAverageResistance = useMemo(
    () => operatorsList.reduce((acc, curr) => acc + curr.combat_res, 0) / operatorsList.length,
    [],
  );
  const statAverageCooldown = useMemo(
    () => operatorsList.reduce((acc, curr) => acc + curr.combat_cldn, 0) / operatorsList.length,
    [],
  );
  const statAverageCost = useMemo(
    () => operatorsList.reduce((acc, curr) => acc + curr.combat_cost, 0) / operatorsList.length,
    [],
  );
  const statAverageBlock = useMemo(
    () => operatorsList.reduce((acc, curr) => acc + curr.combat_blk, 0) / operatorsList.length,
    [],
  );
  const statAverageSpeed = useMemo(
    () => operatorsList.reduce((acc, curr) => acc + curr.combat_atkspd, 0) / operatorsList.length,
    [],
  );

//whole and filtered for each

//average
//max
//min

  const columns = useMemo(
    () => [
      {
        id: 'info_basic',
        header:"Basic Information",
        muiTableHeadCellProps: { sx: { color: "black" } }, 
        columns: [
          {
            accessorKey: "name_code",
            header: "Code Name",
            muiTableHeadCellProps: { sx: { color: "black" } }, 
            Cell: ({ cell, row }) => <a href={`../${row.original.ID}`}><strong>{cell.getValue()}</strong></a>,
            enableHiding: false,
            filterVariant: 'multi-select',
            enableGrouping: false, 
          },
          {
            accessorKey: "name_real",
            header: "Real Name",
            muiTableHeadCellProps: { sx: { color: "black" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
          },
          {
            accessorKey: "date_joined",
            header: "Introduced",
            muiTableHeadCellProps: { sx: { color: "black" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
          },
          
          {
            accessorKey: "affiliation_location",
            header: "Location",
            muiTableHeadCellProps: { sx: { color: "black" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'multi-select',
          },
          {
            accessorKey: "affiliation_organization",
            header: "Organization",
            muiTableHeadCellProps: { sx: { color: "black" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'multi-select',
          },
          {
            accessorKey: "experience_combat",
            header: "Experience (years)",
            muiTableHeadCellProps: { sx: { color: "black" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'range-slider',
            muiFilterSliderProps: {
              marks: true,
              step: 0.5,
            },
          },
        ],
      },
      {
        id: 'info_operator',
        header:"Operator Information",
        muiTableHeadCellProps: { sx: { color: "blue" } }, 
        columns: [
          {
            accessorKey: "operatorRecords_rarity",
            header: "Rarity",
            muiTableHeadCellProps: { sx: { color: "blue" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'range-slider',
            muiFilterSliderProps: {
              marks: true,
              step: 1,
            },
          },
          {
            accessorKey: "operatorRecords_class",
            header: "Class",
            muiTableHeadCellProps: { sx: { color: "blue" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'multi-select',
          },
          {
            accessorKey: "operatorRecords_job",
            header: "Job",
            muiTableHeadCellProps: { sx: { color: "blue" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'multi-select',
          }
        ]},
      {
        id: 'info_medical',
        header:"Biological Information",
        muiTableHeadCellProps: { sx: { color: "green" } },
        columns: [
          {
            accessorKey: "gender",
            header: "Gender",
            muiTableHeadCellProps: { sx: { color: "green" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'multi-select',
          },
          {
            accessorKey: "species",
            header: "Species",
            muiTableHeadCellProps: { sx: { color: "green" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'multi-select',
          },
          {
            accessorKey: "place_birth",
            header: "Birth Place",
            muiTableHeadCellProps: { sx: { color: "green" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'multi-select',
          },
          {
            accessorKey: "date_birth",
            header: "Birthdate",
            muiTableHeadCellProps: { sx: { color: "green" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,

          },
        {
          accessorKey: "medical_oripathy",
          header: "Oripathy",
          muiTableHeadCellProps: { sx: { color: "green" } }, 
          Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
          enableColumnDragging: true,
          filterVariant: 'multi-select',
        },
        {
          accessorKey: "medical_fusion",
          header: "Fusion",
          muiTableHeadCellProps: { sx: { color: "green" } }, 
          Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
          enableColumnDragging: true,
          filterVariant: 'range-slider',
            muiFilterSliderProps: {
              marks: true,
              step: 1,
            },
        },
        {
          accessorKey: "medical_bloodRatio",
          header: "Blood Ratio",
          muiTableHeadCellProps: { sx: { color: "green" } }, 
          Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
          enableColumnDragging: true,
          filterVariant: 'range-slider',
            muiFilterSliderProps: {
              marks: true,
              step: 0.01,
            },
        },
        ]},
      {
        id: 'physical_examination',
        header:"Physical Examination",
        muiTableHeadCellProps: { sx: { color: "darkcyan" } },
        columns: [
          {
            accessorKey: "skills_strength",
            header: "Strength",
            muiTableHeadCellProps: { sx: { color: "darkcyan" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'multi-select',
          },
          {
            accessorKey: "skills_mobility",
            header: "Mobility",
            muiTableHeadCellProps: { sx: { color: "darkcyan" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'multi-select',
          },
          {
            accessorKey: "skills_endurance",
            header: "Endurance",
            muiTableHeadCellProps: { sx: { color: "darkcyan" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'multi-select',
          },
          {
            accessorKey: "skills_tacticalAcumen",
            header: "Tactical Acumen",
            muiTableHeadCellProps: { sx: { color: "darkcyan" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'multi-select',
          },
          {
            accessorKey: "skills_combat",
            header: "Combat",
            muiTableHeadCellProps: { sx: { color: "darkcyan" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'multi-select',
          },
          {
            accessorKey: "skills_artsAdaptability",
            header: "Arts Adaptability",
            muiTableHeadCellProps: { sx: { color: "darkcyan" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'multi-select',
          },
        ]},
      {
        id: 'combat_status',
        header:"Combat Status (P:2 LV:MAX)",
        muiTableHeadCellProps: { sx: { color: "red" } },
        columns: [
          {
            accessorKey: "combat_hp",
            header: "Health Points",
            muiTableHeadCellProps: { sx: { color: "red" } }, 
            enableColumnDragging: true,
            filterVariant: 'range',
          filterFn: 'between',
          aggregationFn: 'mean',
          AggregatedCell: ({ cell, table }) => (
            <>
              <Box>
              Average by{' '}
              {table.getColumn(cell.row.groupingColumnId ?? '').columnDef.header}:{' '}
                {Math.round(cell.getValue())?.toLocaleString()}
              </Box>
            </>
          ),
          Cell: ({ cell }) => (
            <strong>
              {cell.getValue()?.toLocaleString()}
            </strong>
          ),
        Footer: () => (
          <Stack>
            <Box sx={{ fontWeight: 'bold' }}>
            Average by All:{' '}
              {Math.round(statAverageHealth).toLocaleString()}
            </Box>
          </Stack>
        ),
          },
          {
            accessorKey: "combat_atk",
            header: "Attack",
            muiTableHeadCellProps: { sx: { color: "red" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'range',
        filterFn: 'between',
        aggregationFn: 'mean',
          AggregatedCell: ({ cell, table }) => (
            <>
              <Box>
              Average by{' '}
              {table.getColumn(cell.row.groupingColumnId ?? '').columnDef.header}:{' '}
                {Math.round(cell.getValue())?.toLocaleString()}
              </Box>
            </>
          ),
          Cell: ({ cell }) => (
            <strong>
              {cell.getValue()?.toLocaleString()}
            </strong>
          ),
        Footer: () => (
          <Stack>
            <Box sx={{ fontWeight: 'bold' }}>
            Average by All:{' '}
              {Math.round(statAverageHealth).toLocaleString()}
            </Box>
          </Stack>
        ),
          },
          {
            accessorKey: "combat_def",
            header: "Defence",
            muiTableHeadCellProps: { sx: { color: "red" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'range',
        filterFn: 'between',
        aggregationFn: 'mean',
          AggregatedCell: ({ cell, table }) => (
            <>
              <Box>
              Average by{' '}
              {table.getColumn(cell.row.groupingColumnId ?? '').columnDef.header}:{' '}
                {Math.round(cell.getValue())?.toLocaleString()}
              </Box>
            </>
          ),
          Cell: ({ cell }) => (
            <strong>
              {cell.getValue()?.toLocaleString()}
            </strong>
          ),
        Footer: () => (
          <Stack>
            <Box sx={{ fontWeight: 'bold' }}>
            Average by All:{' '}
              {Math.round(statAverageDefense).toLocaleString()}
            </Box>
          </Stack>
        ),
          },
          {
            accessorKey: "combat_res",
            header: "Resistance",
            muiTableHeadCellProps: { sx: { color: "red" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'range',
        filterFn: 'between',
        aggregationFn: 'mean',
          AggregatedCell: ({ cell, table }) => (
            <>
              <Box>
              Average by{' '}
              {table.getColumn(cell.row.groupingColumnId ?? '').columnDef.header}:{' '}
                {Math.round(cell.getValue())?.toLocaleString()}
              </Box>
            </>
          ),
          Cell: ({ cell }) => (
            <strong>
              {cell.getValue()?.toLocaleString()}
            </strong>
          ),
        Footer: () => (
          <Stack>
            <Box sx={{ fontWeight: 'bold' }}>
            Average by All:{' '}
              {Math.round(statAverageResistance).toLocaleString()}
            </Box>
          </Stack>
        ),
          },
          {
            accessorKey: "combat_cldn",
            header: "Deployment Cooldown",
            muiTableHeadCellProps: { sx: { color: "red" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'range',
        filterFn: 'between',
        aggregationFn: 'mean',
          AggregatedCell: ({ cell, table }) => (
            <>
              <Box>
              Average by{' '}
              {table.getColumn(cell.row.groupingColumnId ?? '').columnDef.header}:{' '}
                {Math.round(cell.getValue())?.toLocaleString()}
              </Box>
            </>
          ),
          Cell: ({ cell }) => (
            <strong>
              {cell.getValue()?.toLocaleString()}
            </strong>
          ),
        Footer: () => (
          <Stack>
            <Box sx={{ fontWeight: 'bold' }}>
            Average by All:{' '}
              {Math.round(statAverageCooldown).toLocaleString()}
            </Box>
          </Stack>
        ),
          },
          {
            accessorKey: "combat_cost",
            header: "Deployment Cost",
            muiTableHeadCellProps: { sx: { color: "red" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'range',
        filterFn: 'between',
        aggregationFn: 'mean',
          AggregatedCell: ({ cell, table }) => (
            <>
              <Box>
              Average by{' '}
              {table.getColumn(cell.row.groupingColumnId ?? '').columnDef.header}:{' '}
                {Math.round(cell.getValue())?.toLocaleString()}
              </Box>
            </>
          ),
          Cell: ({ cell }) => (
            <strong>
              {cell.getValue()?.toLocaleString()}
            </strong>
          ),
        Footer: () => (
          <Stack>
            <Box sx={{ fontWeight: 'bold' }}>
            Average by All:{' '}
              {Math.round(statAverageCost).toLocaleString()}
            </Box>
          </Stack>
        ),
          },
          {
            accessorKey: "combat_blk",
            header: "Block Amount",
            muiTableHeadCellProps: { sx: { color: "red" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'range',
        filterFn: 'between',
        aggregationFn: 'mean',
          AggregatedCell: ({ cell, table }) => (
            <>
              <Box>
              Average by{' '}
              {table.getColumn(cell.row.groupingColumnId ?? '').columnDef.header}:{' '}
                {Math.round(cell.getValue())?.toLocaleString()}
              </Box>
            </>
          ),
          Cell: ({ cell }) => (
            <strong>
              {cell.getValue()?.toLocaleString()}
            </strong>
          ),
        Footer: () => (
          <Stack>
            <Box sx={{ fontWeight: 'bold' }}>
            Average by All:{' '}
              {Math.round(statAverageBlock).toLocaleString()}
            </Box>
          </Stack>
        ),
          },
          {
            accessorKey: "combat_atkspd",
            header: "Atack Speed (per second)",
            muiTableHeadCellProps: { sx: { color: "red" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'range',
        filterFn: 'between',
        aggregationFn: 'mean',
          AggregatedCell: ({ cell, table }) => (
            <>
              <Box>
              Average by{' '}
              {table.getColumn(cell.row.groupingColumnId ?? '').columnDef.header}:{' '}
                {Math.round(cell.getValue())?.toLocaleString()}
              </Box>
            </>
          ),
          Cell: ({ cell }) => (
            <strong>
              {cell.getValue()?.toLocaleString()}
            </strong>
          ),
        Footer: () => (
          <Stack>
            <Box sx={{ fontWeight: 'bold' }}>
            Average by All:{' '}
              {Math.round(statAverageSpeed).toLocaleString()}
            </Box>
          </Stack>
        ),
          },
        ]
      }
    ],
    [statAverageHealth]
  );

  const table = useMaterialReactTable({
    data: operatorsList,
    columns,
    // enableColumnResizing: true,
    enableColumnOrdering: true,
    enableGrouping: true,
    groupedColumnMode: 'remove',
    enableFacetedValues: true,
    enableStickyHeader: true,
    enableStickyFooter: true,
    enableColumnPinning: true,
    // enablePagination: false,
    enableRowPinning: true,
    // enableRowSelection: true,
    rowPinningDisplayMode: 'select-sticky',
    initialState: {
      showColumnFilters: true,
      density: 'compact',
      pagination:{pageSize: 25,},
      columnVisibility: {
        name_real: false,
        date_joined: false,
        gender: false,
        species: false,
        affiliation_location: false,
        affiliation_organization: false,
        experience_combat: false,
        place_birth: false,
        date_birth: false,
        medical_oripathy: false,
        medical_fusion: false,
        medical_bloodRatio: false,
        skills_strength: false,
        skills_mobility: false,
        skills_endurance: false,
        skills_tacticalAcumen: false,
        skills_combat: false,
        skills_artsAdaptability:false,
        combat_hp: false,
        combat_atk: false,
        combat_def:false,
        combat_res:false,
        combat_cldn:false,
        combat_cost:false,
        combat_blk:false,
        combat_atkspd:false,
      }
    }, 
  }
);

return <div>
    <MaterialReactTable table={table} />;
    </div>
}
