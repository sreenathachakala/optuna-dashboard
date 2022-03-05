import React, { FC, useEffect, useState } from "react"
import { useRecoilValue } from "recoil"
import { Link, useParams } from "react-router-dom"
import {
  AppBar,
  Dialog,
  Checkbox,
  Card,
  Typography,
  CardContent,
  Container,
  Grid,
  Toolbar,
  Paper,
  Box,
  IconButton,
  Select,
  MenuItem,
  FormGroup,
  useTheme,
  FormLabel,
  FormControl,
} from "@mui/material"
import { Home, Settings } from "@mui/icons-material"
import FormControlLabel from "@mui/material/FormControlLabel"
import MuiDialogTitle from "@mui/material/DialogTitle"
import MuiDialogContent from "@mui/material/DialogContent"
import CloseIcon from "@mui/icons-material/Close"

import { DataGridColumn, DataGrid } from "./DataGrid"
import { GraphParallelCoordinate } from "./GraphParallelCoordinate"
import { GraphHyperparameterImportances } from "./GraphHyperparameterImportances"
import { Edf } from "./GraphEdf"
import { GraphIntermediateValues } from "./GraphIntermediateValues"
import { GraphSlice } from "./GraphSlice"
import { GraphHistory } from "./GraphHistory"
import { GraphParetoFront } from "./GraphParetoFront"
import { actionCreator } from "../action"
import { studyDetailsState } from "../state"

interface ParamTypes {
  studyId: string
}

const isSingleObjectiveStudy = (studyDetail: StudyDetail): boolean => {
  return studyDetail.directions.length === 1
}

export const useStudyDetailValue = (studyId: number): StudyDetail | null => {
  const studyDetails = useRecoilValue<StudyDetails>(studyDetailsState)
  return studyDetails[studyId] || null
}

export const StudyDetail: FC = () => {
  const theme = useTheme()
  const action = actionCreator()
  const { studyId } = useParams<ParamTypes>()
  const studyIdNumber = parseInt(studyId, 10)
  const studyDetail = useStudyDetailValue(studyIdNumber)

  const [preferences, setPreferences] = useState({
    graphHistoryChecked: true,
    graphParetoFrontChecked: true,
    graphParallelCoordinateChecked: true,
    graphIntermediateValuesChecked: true,
    edfChecked: true,
    graphHyperparameterImportancesChecked: true,
    graphSliceChecked: true,
    reloadInterval: 10,
  })
  useEffect(() => {
    const localStoragePreferences = localStorage.getItem("savedPref")
    if (localStoragePreferences !== null) {
      const merged = { ...preferences, ...JSON.parse(localStoragePreferences) }
      setPreferences(merged)
    }
  }, [])
  useEffect(() => {
    localStorage.setItem("savedPref", JSON.stringify(preferences))
  }, [preferences])

  const [prefOpen, setPrefOpen] = useState(false)
  const handleClickOpen = () => {
    setPrefOpen(true)
  }
  const handleClose = () => {
    setPrefOpen(false)
  }
  const handleChartShownChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPreferences({
      ...preferences,
      [event.target.name]: event.target.checked,
    })
  }

  useEffect(() => {
    action.updateStudyDetail(studyIdNumber)
  }, [])

  useEffect(() => {
    if (preferences.reloadInterval < 0) {
      return
    }
    const intervalId = setInterval(function () {
      action.updateStudyDetail(studyIdNumber)
    }, preferences.reloadInterval * 1000)
    return () => clearInterval(intervalId)
  }, [preferences.reloadInterval, studyDetail])
  // TODO(chenghuzi): Reduce the number of calls to setInterval and clearInterval.

  const title = studyDetail !== null ? studyDetail.name : `Study #${studyId}`
  const trials: Trial[] = studyDetail !== null ? studyDetail.trials : []

  return (
    <div>
      <Dialog onClose={handleClose} aria-labelledby="vis-pref" open={prefOpen}>
        <MuiDialogTitle
          sx={{
            margin: 0,
            padding: theme.spacing(2),
            minWidth: 300,
          }}
        >
          <Typography variant="h6">Preferences</Typography>
          <IconButton
            aria-label="close"
            sx={{
              position: "absolute",
              right: theme.spacing(1),
              top: theme.spacing(1),
              color: theme.palette.grey[500],
            }}
            onClick={handleClose}
          >
            <CloseIcon />
          </IconButton>
        </MuiDialogTitle>
        <MuiDialogContent dividers>
          <FormLabel component="legend">Charts</FormLabel>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={preferences.graphHistoryChecked}
                  onChange={handleChartShownChange}
                  name="graphHistoryChecked"
                />
              }
              label="History"
            />
            <FormControlLabel
              disabled={
                studyDetail !== null && isSingleObjectiveStudy(studyDetail)
              }
              control={
                <Checkbox
                  checked={preferences.graphParetoFrontChecked}
                  onChange={handleChartShownChange}
                  name="graphParetoFrontChecked"
                />
              }
              label="Pareto Front"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={preferences.graphParallelCoordinateChecked}
                  onChange={handleChartShownChange}
                  name="graphParallelCoordinateChecked"
                />
              }
              label="Parallel Coordinate"
            />
            <FormControlLabel
              disabled={
                studyDetail !== null && !isSingleObjectiveStudy(studyDetail)
              }
              control={
                <Checkbox
                  checked={preferences.graphIntermediateValuesChecked}
                  onChange={handleChartShownChange}
                  name="graphIntermediateValuesChecked"
                />
              }
              label="Intermediate Values"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={preferences.edfChecked}
                  onChange={handleChartShownChange}
                  name="edfChecked"
                />
              }
              label="EDF"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={preferences.graphHyperparameterImportancesChecked}
                  onChange={handleChartShownChange}
                  name="graphHyperparameterImportancesChecked"
                />
              }
              label="Hyperparameter Importances"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={preferences.graphSliceChecked}
                  onChange={handleChartShownChange}
                  name="graphSliceChecked"
                />
              }
              label="Slice"
            />
          </FormGroup>
          <FormLabel component="legend" sx={{ marginTop: theme.spacing(2) }}>
            Reload Interval
          </FormLabel>
          <FormControl variant="standard">
            <Select
              labelId="pref-reload-interval"
              value={preferences.reloadInterval}
              onChange={(e) => {
                setPreferences({
                  ...preferences,
                  ["reloadInterval"]: e.target.value as number,
                })
              }}
            >
              <MenuItem value={-1}>stop</MenuItem>
              <MenuItem value={5}>5s</MenuItem>
              <MenuItem value={10}>10s</MenuItem>
              <MenuItem value={30}>30s</MenuItem>
              <MenuItem value={60}>60s</MenuItem>
            </Select>
          </FormControl>
        </MuiDialogContent>
      </Dialog>
      <AppBar position="static">
        <Container
          sx={{
            ["@media (min-width: 1280px)"]: {
              maxWidth: "100%",
            },
          }}
        >
          <Toolbar>
            <Typography variant="h6">{APP_BAR_TITLE}</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton color="inherit" onClick={handleClickOpen}>
              <Settings />
            </IconButton>
            <IconButton
              aria-controls="menu-appbar"
              aria-haspopup="true"
              component={Link}
              to={URL_PREFIX + "/"}
              color="inherit"
            >
              <Home />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>
      <Container
        sx={{
          ["@media (min-width: 1280px)"]: {
            maxWidth: "100%",
          },
        }}
      >
        <div>
          <Paper
            sx={{
              margin: theme.spacing(2),
              padding: theme.spacing(2),
            }}
          >
            <Typography variant="h6">{title}</Typography>
          </Paper>
          {preferences.graphHistoryChecked ? (
            <Card
              sx={{
                margin: theme.spacing(2),
              }}
            >
              <CardContent>
                <GraphHistory study={studyDetail} />
              </CardContent>
            </Card>
          ) : null}

          {studyDetail !== null &&
          !isSingleObjectiveStudy(studyDetail) &&
          preferences.graphParetoFrontChecked ? (
            <Card sx={{ margin: theme.spacing(2) }}>
              <CardContent>
                <GraphParetoFront study={studyDetail} />
              </CardContent>
            </Card>
          ) : null}
          {preferences.graphParallelCoordinateChecked ? (
            <Card sx={{ margin: theme.spacing(2) }}>
              <CardContent>
                <GraphParallelCoordinate study={studyDetail} />
              </CardContent>
            </Card>
          ) : null}

          {studyDetail !== null &&
          isSingleObjectiveStudy(studyDetail) &&
          preferences.graphIntermediateValuesChecked ? (
            <Card sx={{ margin: theme.spacing(2) }}>
              <CardContent>
                <GraphIntermediateValues trials={trials} />
              </CardContent>
            </Card>
          ) : null}
          {preferences.edfChecked ? (
            <Card sx={{ margin: theme.spacing(2) }}>
              <CardContent>
                <Edf study={studyDetail} />
              </CardContent>
            </Card>
          ) : null}
          {preferences.graphHyperparameterImportancesChecked ? (
            <Card sx={{ margin: theme.spacing(2) }}>
              <CardContent>
                <GraphHyperparameterImportances
                  study={studyDetail}
                  studyId={studyIdNumber}
                />
              </CardContent>
            </Card>
          ) : null}

          {studyDetail !== null && preferences.graphSliceChecked ? (
            <Card sx={{ margin: theme.spacing(2) }}>
              <CardContent>
                <GraphSlice study={studyDetail} />
              </CardContent>
            </Card>
          ) : null}
          <Card sx={{ margin: theme.spacing(2) }}>
            <TrialTable studyDetail={studyDetail} />
          </Card>
        </div>
      </Container>
    </div>
  )
}

export const TrialTable: FC<{ studyDetail: StudyDetail | null }> = ({
  studyDetail,
}) => {
  const trials: Trial[] = studyDetail !== null ? studyDetail.trials : []

  const columns: DataGridColumn<Trial>[] = [
    { field: "number", label: "Number", sortable: true, padding: "none" },
    {
      field: "state",
      label: "State",
      sortable: true,
      filterable: true,
      padding: "none",
      toCellValue: (i) => trials[i].state.toString(),
    },
  ]
  if (studyDetail === null || isSingleObjectiveStudy(studyDetail)) {
    columns.push({
      field: "values",
      label: "Value",
      sortable: true,
      less: (firstEl, secondEl): number => {
        const firstVal = firstEl.values?.[0]
        const secondVal = secondEl.values?.[0]

        if (firstVal === secondVal) {
          return 0
        } else if (firstVal && secondVal) {
          return firstVal < secondVal ? 1 : -1
        } else if (firstVal) {
          return -1
        } else {
          return 1
        }
      },
      toCellValue: (i) => {
        if (trials[i].values === undefined) {
          return null
        }
        return trials[i].values?.[0]
      },
    })
  } else {
    const objectiveColumns: DataGridColumn<Trial>[] =
      studyDetail.directions.map((s, objectiveId) => ({
        field: "values",
        label: `Objective ${objectiveId}`,
        sortable: true,
        less: (firstEl, secondEl): number => {
          const firstVal = firstEl.values?.[objectiveId]
          const secondVal = secondEl.values?.[objectiveId]

          if (firstVal === secondVal) {
            return 0
          } else if (firstVal && secondVal) {
            return firstVal < secondVal ? 1 : -1
          } else if (firstVal) {
            return -1
          } else {
            return 1
          }
        },
        toCellValue: (i) => {
          if (trials[i].values === undefined) {
            return null
          }
          return trials[i].values?.[objectiveId]
        },
      }))
    columns.push(...objectiveColumns)
  }
  columns.push({
    field: "datetime_start",
    label: "Duration(ms)",
    toCellValue: (i) => {
      const startMs = trials[i].datetime_start?.getTime()
      const completeMs = trials[i].datetime_complete?.getTime()
      if (startMs !== undefined && completeMs !== undefined) {
        return (completeMs - startMs).toString()
      }
      return null
    },
    sortable: true,
    less: (firstEl, secondEl): number => {
      const firstStartMs = firstEl.datetime_start?.getTime()
      const firstCompleteMs = firstEl.datetime_complete?.getTime()
      const firstDurationMs =
        firstStartMs !== undefined && firstCompleteMs !== undefined
          ? firstCompleteMs - firstStartMs
          : undefined
      const secondStartMs = secondEl.datetime_start?.getTime()
      const secondCompleteMs = secondEl.datetime_complete?.getTime()
      const secondDurationMs =
        secondStartMs !== undefined && secondCompleteMs !== undefined
          ? secondCompleteMs - secondStartMs
          : undefined

      if (firstDurationMs === secondDurationMs) {
        return 0
      } else if (
        firstDurationMs !== undefined &&
        secondDurationMs !== undefined
      ) {
        return firstDurationMs < secondDurationMs ? 1 : -1
      } else if (firstDurationMs !== undefined) {
        return -1
      } else {
        return 1
      }
    },
  })
  columns.push({
    field: "params",
    label: "Params",
    toCellValue: (i) =>
      trials[i].params.map((p) => p.name + ": " + p.value).join(", "),
  })

  const collapseParamColumns: DataGridColumn<TrialParam>[] = [
    { field: "name", label: "Name", sortable: true },
    { field: "value", label: "Value", sortable: true },
  ]
  const collapseIntermediateValueColumns: DataGridColumn<TrialIntermediateValue>[] =
    [
      { field: "step", label: "Step", sortable: true },
      { field: "value", label: "Value", sortable: true },
    ]
  const collapseAttrColumns: DataGridColumn<Attribute>[] = [
    { field: "key", label: "Key", sortable: true },
    { field: "value", label: "Value", sortable: true },
  ]

  const collapseBody = (index: number) => {
    return (
      <Grid container direction="row">
        <Grid item xs={6}>
          <Box margin={1}>
            <Typography variant="h6" gutterBottom component="div">
              Parameters
            </Typography>
            <DataGrid<TrialParam>
              columns={collapseParamColumns}
              rows={trials[index].params}
              keyField={"name"}
              dense={true}
              rowsPerPageOption={[5, 10, { label: "All", value: -1 }]}
            />
            <Typography variant="h6" gutterBottom component="div">
              Trial user attributes
            </Typography>
            <DataGrid<Attribute>
              columns={collapseAttrColumns}
              rows={trials[index].user_attrs}
              keyField={"key"}
              dense={true}
              rowsPerPageOption={[5, 10, { label: "All", value: -1 }]}
            />
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box margin={1}>
            <Typography variant="h6" gutterBottom component="div">
              Intermediate values
            </Typography>
            <DataGrid<TrialIntermediateValue>
              columns={collapseIntermediateValueColumns}
              rows={trials[index].intermediate_values}
              keyField={"step"}
              dense={true}
              rowsPerPageOption={[5, 10, { label: "All", value: -1 }]}
            />
            <Typography variant="h6" gutterBottom component="div">
              Trial system attributes
            </Typography>
            <DataGrid<Attribute>
              columns={collapseAttrColumns}
              rows={trials[index].system_attrs}
              keyField={"key"}
              dense={true}
              rowsPerPageOption={[5, 10, { label: "All", value: -1 }]}
            />
          </Box>
        </Grid>
      </Grid>
    )
  }

  return (
    <DataGrid<Trial>
      columns={columns}
      rows={trials}
      keyField={"trial_id"}
      dense={true}
      collapseBody={collapseBody}
    />
  )
}
