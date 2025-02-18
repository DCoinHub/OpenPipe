import { Card, Table, Thead, Tr, Th, Tbody, Td, VStack, Icon, Text } from "@chakra-ui/react";
import { FaTable } from "react-icons/fa";
import { type FineTuneStatus } from "@prisma/client";
import Link from "next/link";

import dayjs from "~/utils/dayjs";
import { useFineTunes } from "~/utils/hooks";
import { displayBaseModel } from "~/utils/baseModels";

const FineTunesTable = ({}) => {
  const { data } = useFineTunes(10000);

  const fineTunes = data?.fineTunes || [];

  return (
    <Card width="100%" overflowX="auto">
      {fineTunes.length ? (
        <Table>
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Created At</Th>
              <Th>Base Model</Th>
              <Th>Training Size</Th>
              <Th>Pruning Rules</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {fineTunes.map((fineTune) => {
              return (
                <Tr key={fineTune.id}>
                  <Td>
                    <Link href={{ pathname: "/fine-tunes/[id]", query: { id: fineTune.id } }}>
                      <Text color="blue.600">openpipe:{fineTune.slug}</Text>
                    </Link>
                  </Td>
                  <Td>{dayjs(fineTune.createdAt).format("MMMM D h:mm A")}</Td>
                  <Td>{displayBaseModel(fineTune.baseModel)}</Td>
                  <Td>{fineTune._count.trainingEntries}</Td>
                  <Td>{fineTune._count.pruningRules}</Td>
                  <Td fontSize="sm" fontWeight="bold">
                    <Text color={getStatusColor(fineTune.status)}>{fineTune.status}</Text>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      ) : (
        <VStack py={8}>
          <Icon as={FaTable} boxSize={16} color="gray.300" />
          <Text color="gray.400" fontSize="lg" fontWeight="bold">
            No Fine Tunes Found
          </Text>
        </VStack>
      )}
    </Card>
  );
};

export default FineTunesTable;

const getStatusColor = (status: FineTuneStatus) => {
  switch (status) {
    case "DEPLOYED":
      return "green.500";
    case "ERROR":
      return "red.500";
    default:
      return "yellow.500";
  }
};
