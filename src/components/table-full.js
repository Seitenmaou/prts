import React, { useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable
} from "material-react-table";

export default function TableFull ({operatorsList}) {

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
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableHiding: false,
            filterVariant: 'multi-select',
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
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'range',
        filterFn: 'between',
          },
          {
            accessorKey: "combat_atk",
            header: "Attack",
            muiTableHeadCellProps: { sx: { color: "red" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'range',
        filterFn: 'between',
          },
          {
            accessorKey: "combat_def",
            header: "Defence",
            muiTableHeadCellProps: { sx: { color: "red" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'range',
        filterFn: 'between',
          },
          {
            accessorKey: "combat_res",
            header: "Resistance",
            muiTableHeadCellProps: { sx: { color: "red" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'range',
        filterFn: 'between',
          },
          {
            accessorKey: "combat_cldn",
            header: "Deployment Cooldown",
            muiTableHeadCellProps: { sx: { color: "red" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'range',
        filterFn: 'between',
          },
          {
            accessorKey: "combat_cost",
            header: "Deployment Cost",
            muiTableHeadCellProps: { sx: { color: "red" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'range',
        filterFn: 'between',
          },
          {
            accessorKey: "combat_blk",
            header: "Block Amount",
            muiTableHeadCellProps: { sx: { color: "red" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'range',
        filterFn: 'between',
          },
          {
            accessorKey: "combat_atkspd",
            header: "Atack Speed (per second)",
            muiTableHeadCellProps: { sx: { color: "red" } }, 
            Cell: ({ renderedCellValue }) => <strong>{renderedCellValue}</strong>,
            enableColumnDragging: true,
            filterVariant: 'range',
        filterFn: 'between',
          },
        ]}

    ],
    []
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
    enableRowSelection: true,
    rowPinningDisplayMode: 'select-sticky',
    initialState: {
      showColumnFilters: true,
      // density: 'compact',
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
    
  });

//   console.log(table.getFilteredRowModel().rows.map(row => row.original))

  return <MaterialReactTable table={table} />;
}