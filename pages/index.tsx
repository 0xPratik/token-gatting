import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import {
  Box,
  HStack,
  VStack,
  Flex,
  Button,
  Heading,
  Text,
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

const Home: NextPage = () => {
  const wallet = useWallet();
  const [tokens, setTokens] = useState<Array<any>>([]);
  const [isAllowed, setisAllowed] = useState<boolean>(false);
  const toast = useToast();

  const fetchTokenAccounts = async () => {
    if (
      (wallet.connected && wallet.publicKey === null) ||
      wallet.publicKey === undefined
    ) {
      toast({
        title: "Please Connect your Wallet",
        status: "info",
        duration: 9000,
        isClosable: true,
      });
      return;
    }

    if (wallet.publicKey?.toBase58() === undefined) {
      return;
    }

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    const accounts = await connection.getParsedProgramAccounts(
      TOKEN_PROGRAM_ID, // new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
      {
        filters: [
          {
            dataSize: 165, // number of bytes
          },
          {
            memcmp: {
              offset: 32, // number of bytes
              bytes: wallet.publicKey?.toBase58(), // base58 encoded string
            },
          },
        ],
      }
    );

    const filteredAccounts = accounts.filter((account) => {
      const data: any = account.account.data;
      if (data.parsed.info.tokenAmount.decimals !== 0) {
        return data.parsed.info;
      }
    });

    console.log("Filtered Infos", filteredAccounts);

    if (filteredAccounts.length === 0) {
      toast({
        title: "hmm seams like you dont have any tokens",
        description: "Please try again by refreshing the page",
        status: "info",
        duration: 9000,
        isClosable: true,
      });
      return;
    }

    const tokenAmount = process.env.NEXT_PUBLIC_TOKEN_AMOUNT || 10000000;
    console.log("TOKEN AMOUNT ", tokenAmount);

    filteredAccounts.forEach((token: any) => {
      console.log("MINT", token.account.data.parsed.info.mint);
      console.log(
        "UI Amount",
        token.account.data.parsed.info.tokenAmount.uiAmount
      );

      if (
        token.account.data.parsed.info.mint ===
          process.env.NEXT_PUBLIC_MINT_ADDRESS &&
        token.account.data.parsed.info.tokenAmount.uiAmount >= tokenAmount
      ) {
        setisAllowed(true);
      }
    });
  };

  useEffect(() => {
    fetchTokenAccounts();
  }, [wallet]);

  return (
    <Box w="100vw" h="100vh" bg="blackAlpha.800" p={4}>
      <HStack h="50px" align="center" justify={"end"}>
        <WalletMultiButton />
      </HStack>
      <Flex mt={10} w="full" maxH={"30vh"} align={"center"} justify="center">
        {isAllowed ? (
          <Box
            border={"1px"}
            p={4}
            bg="green.500"
            borderColor="white"
            borderRadius={"base"}
          >
            <VStack w="full" h="20vh">
              <Heading color="whiteAlpha.900">
                You can view this cause you have the token to view this
              </Heading>
              <Text color="whiteAlpha.900">
                So Congrats on having the required Token
              </Text>
            </VStack>
          </Box>
        ) : (
          <Box
            border={"1px"}
            p={4}
            bg="red.500"
            borderColor="white"
            borderRadius={"base"}
          >
            <VStack w="full" h="20vh">
              <Heading color="whiteAlpha.900">
                You can&apos;t view this cause you don&apos;t have the token to
                view this
              </Heading>
              <Text color="whiteAlpha.900">
                So please get {process.env.NEXT_PUBLIC_TOKEN_AMOUNT} amount of
                the token of mint :- {process.env.NEXT_PUBLIC_MINT_ADDRESS}
              </Text>
            </VStack>
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default Home;
