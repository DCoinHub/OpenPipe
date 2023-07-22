import { Grid, GridItem, type GridItemProps } from "@chakra-ui/react";
import { api } from "~/utils/api";
import AddVariantButton from "./AddVariantButton";
import ScenarioRow from "./ScenarioRow";
import VariantEditor from "./VariantEditor";
import VariantHeader from "../VariantHeader/VariantHeader";
import VariantStats from "./VariantStats";
import { ScenariosHeader } from "./ScenariosHeader";
import { borders } from "./styles";

export default function OutputsTable({ experimentId }: { experimentId: string | undefined }) {
  const variants = api.promptVariants.list.useQuery(
    { experimentId: experimentId as string },
    { enabled: !!experimentId },
  );

  const scenarios = api.scenarios.list.useQuery(
    { experimentId: experimentId as string },
    { enabled: !!experimentId },
  );

  if (!variants.data || !scenarios.data) return null;

  const allCols = variants.data.length + 2;
  const variantHeaderRows = 3;
  const scenarioHeaderRows = 1;
  const allRows = variantHeaderRows + scenarioHeaderRows + scenarios.data.length;

  return (
    <Grid
      pt={4}
      pb={24}
      pl={4}
      display="grid"
      gridTemplateColumns={`250px repeat(${variants.data.length}, minmax(300px, 1fr)) auto`}
      sx={{
        "> *": {
          borderColor: "gray.300",
        },
      }}
      fontSize="sm"
    >
      <GridItem rowSpan={variantHeaderRows}>
        <AddVariantButton />
      </GridItem>

      {variants.data.map((variant, i) => {
        const sharedProps: GridItemProps = {
          ...borders,
          colStart: i + 2,
          borderLeftWidth: i === 0 ? 1 : 0,
        };
        return (
          <>
            <VariantHeader
              key={variant.uiId}
              variant={variant}
              canHide={variants.data.length > 1}
              rowStart={1}
              {...sharedProps}
            />
            <GridItem rowStart={2} {...sharedProps}>
              <VariantEditor variant={variant} />
            </GridItem>
            <GridItem rowStart={3} {...sharedProps}>
              <VariantStats variant={variant} />
            </GridItem>
          </>
        );
      })}

      <GridItem
        colSpan={allCols - 1}
        rowStart={variantHeaderRows + 1}
        colStart={1}
        {...borders}
        borderRightWidth={0}
      >
        <ScenariosHeader numScenarios={scenarios.data.length} />
      </GridItem>

      {scenarios.data.map((scenario, i) => (
        <ScenarioRow
          rowStart={i + variantHeaderRows + scenarioHeaderRows + 2}
          key={scenario.uiId}
          scenario={scenario}
          variants={variants.data}
          canHide={scenarios.data.length > 1}
        />
      ))}

      {/* Add some extra padding on the right, because when the table is too wide to fit in the viewport `pr` on the Grid isn't respected. */}
      <GridItem rowStart={1} colStart={allCols} rowSpan={allRows} w={4} borderBottomWidth={0} />
    </Grid>
  );
}
